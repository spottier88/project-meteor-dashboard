/**
 * @module framingMailMerge
 * @description Logique de publipostage (mail merge) pour l'export de la note de cadrage.
 * Charge un modèle DOCX depuis Supabase Storage, remplace les balises par les données
 * du projet, et génère le fichier final à télécharger.
 *
 * Fonctionnalités clés :
 * - Sanitisation robuste (Unicode NFC, espaces typographiques, XML 1.0)
 * - Nettoyage des balises fractionnées par Word (cleanSplitTags)
 * - Validation XML post-rendu pour détecter les fichiers corrompus
 * - Stratégie de rendu en 2 passes (riche → safe) avec fallback automatique
 * - Journalisation diagnostique des champs à risque
 */

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

/** Forme minimale d'un membre d'équipe attendu dans les données de cadrage */
interface FramingMember {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
}

/** Forme minimale d'un risque attendu dans les données de cadrage */
interface FramingRisk {
  description?: string | null;
  probability?: string | null;
  severity?: string | null;
  status?: string | null;
}

/** Forme minimale d'une tâche attendue dans les données de cadrage */
interface FramingTask {
  title?: string | null;
  status?: string | null;
  assignee?: string | null;
}

/** Données brutes du projet passées en entrée du publipostage */
interface FramingProjectInput {
  project?: {
    title?: string | null;
    code?: string | null;
    project_manager_name?: string | null;
    project_manager?: string | null;
    lifecycle_status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    pole_name?: string | null;
    direction_name?: string | null;
    service_name?: string | null;
    description?: string | null;
    priority?: string | null;
    completion?: number | null;
  };
  framing?: {
    context?: string | null;
    objectives?: string | null;
    stakeholders?: string | null;
    governance?: string | null;
    timeline?: string | null;
    deliverables?: string | null;
    success_indicators?: string | null;
  };
  members?: FramingMember[];
  risks?: FramingRisk[];
  tasks?: FramingTask[];
  // Peut aussi être passé à plat (sans clé "project")
  title?: string | null;
  code?: string | null;
  project_manager_name?: string | null;
  project_manager?: string | null;
  lifecycle_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  pole_name?: string | null;
  direction_name?: string | null;
  service_name?: string | null;
  description?: string | null;
  priority?: string | null;
  completion?: number | null;
}

/**
 * Données nécessaires pour le publipostage
 */
interface MailMergeData {
  titre_projet: string;
  code_projet: string;
  chef_projet: string;
  etat: string;
  date_debut: string;
  date_fin: string;
  organisation: string;
  description: string;
  priorite: string;
  avancement: string;
  contexte: string;
  objectifs: string;
  parties_prenantes: string;
  gouvernance: string;
  calendrier: string;
  livrables: string;
  indicateurs_reussite: string;
  equipe: string;
  risques: string;
  taches: string;
  date_generation: string;
}

/* ═══════════════════════════════════════════════════════════════
   UTILITAIRES DE FORMATAGE
   ═══════════════════════════════════════════════════════════════ */

/** Formate une date ISO en chaîne lisible */
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "Non défini";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
};

/** Traduit le statut du cycle de vie en libellé français */
const translateLifecycleStatus = (status?: string): string => {
  const map: Record<string, string> = {
    draft: "Brouillon",
    active: "Actif",
    on_hold: "En pause",
    completed: "Terminé",
    cancelled: "Annulé",
  };
  return map[status || ""] || status || "Non défini";
};

/** Traduit la priorité en libellé français */
const translatePriority = (priority?: string): string => {
  const map: Record<string, string> = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  };
  return map[priority || ""] || priority || "Non définie";
};

/* ═══════════════════════════════════════════════════════════════
   SANITISATION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Sanitise une chaîne pour injection dans un DOCX via docxtemplater.
 * - Normalise en NFC (caractères composés)
 * - Uniformise les retours à la ligne
 * - Remplace les espaces typographiques par un espace standard
 * - Supprime les caractères interdits par la spécification XML 1.0
 * - Collapse les retours à la ligne triples (prévention corruption)
 */
const sanitizeForDocx = (value: string): string => {
  return value
    .normalize("NFC")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Espaces typographiques → espace standard
    .replace(/[\u00A0\u202F\u2007\u2008\u2009\u200A\u200B]/g, " ")
    // Caractères interdits XML 1.0
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g, "")
    // Réduire les triples sauts de ligne consécutifs
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Applique sanitizeForDocx à toutes les valeurs string d'un objet
 */
const sanitizeAllValues = (data: MailMergeData): MailMergeData => {
  const result = { ...data };
  for (const key of Object.keys(result) as (keyof MailMergeData)[]) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeForDocx(result[key]);
    }
  }
  return result;
};

/**
 * Nettoie le contenu Markdown en texte brut
 */
const stripMarkdown = (md?: string | null): string => {
  if (!md) return "";
  return md
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\n- /g, "\n• ")
    .replace(/\n\d+\.\s/g, "\n• ")
    .trim();
};

/* ═══════════════════════════════════════════════════════════════
   NETTOYAGE DU TEMPLATE (RUNS XML FRAGMENTÉS)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fusionne les runs XML fragmentés contenant des balises {{...}}
 * Word peut découper une balise comme {{titre_projet}} en plusieurs <w:r>/<w:t>,
 * ce qui empêche docxtemplater de les reconnaître.
 *
 * Stratégie améliorée :
 * 1. Extraire tout le texte brut pour trouver les balises {{...}}
 * 2. Reconstruire les zones XML contenant ces balises en fusionnant les <w:r> intermédiaires
 */
const cleanSplitTags = (zip: PizZip): void => {
  const xmlFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/") && name.endsWith(".xml")
  );

  for (const fileName of xmlFiles) {
    const file = zip.file(fileName);
    if (!file) continue;

    let content = file.asText();

    // Stratégie 1 : regex directe sur les fragments {{...}} contenant du XML
    // Capturer toute séquence commençant par {{ et finissant par }} potentiellement
    // entrecoupée de tags XML (<w:r>, <w:rPr>, <w:t>, etc.)
    const tagRegex = /\{(?:<[^>]*>)*\{(?:[^}]|<[^>]*>)*\}(?:<[^>]*>)*\}/g;
    content = content.replace(tagRegex, (match) => {
      if (!match.includes("<")) return match;
      const textOnly = match.replace(/<[^>]+>/g, "");
      return textOnly;
    });

    // Stratégie 2 : gérer les cas où {{ et }} sont dans des <w:t> séparés
    // mais dans le même paragraphe <w:p>
    content = content.replace(
      /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g,
      (_match, pOpen: string, pContent: string, pClose: string) => {
        // Extraire le texte brut du paragraphe
        const plainText = pContent.replace(/<[^>]+>/g, "");
        // Vérifier s'il contient des balises {{ }}
        if (!plainText.includes("{{") || !plainText.includes("}}")) {
          return pOpen + pContent + pClose;
        }

        // Reconstruire : fusionner tous les <w:t> du paragraphe en conservant
        // le premier <w:r> comme enveloppe
        const allText = plainText;
        // Capturer le premier <w:rPr> s'il existe pour conserver le formatage
        const rPrMatch = pContent.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
        const rPr = rPrMatch ? rPrMatch[0] : "";

        const rebuiltContent = `<w:r>${rPr}<w:t xml:space="preserve">${allText}</w:t></w:r>`;
        return pOpen + rebuiltContent + pClose;
      }
    );

    zip.file(fileName, content);
  }
};

/* ═══════════════════════════════════════════════════════════════
   VALIDATION XML POST-RENDU
   ═══════════════════════════════════════════════════════════════ */

/**
 * Valide la conformité XML des fichiers principaux du DOCX après rendu.
 * Utilise DOMParser pour détecter les erreurs de parsing.
 * @returns null si valide, sinon un objet décrivant l'erreur
 */
const validateDocxXml = (
  zip: PizZip
): { file: string; error: string; excerpt: string } | null => {
  const criticalFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/") && name.endsWith(".xml")
  );

  const parser = new DOMParser();

  for (const fileName of criticalFiles) {
    const file = zip.file(fileName);
    if (!file) continue;

    const xmlContent = file.asText();
    const doc = parser.parseFromString(xmlContent, "application/xml");
    const parseError = doc.querySelector("parsererror");

    if (parseError) {
      // Extraire un extrait autour de l'erreur pour diagnostic
      const errorText = parseError.textContent || "Erreur XML inconnue";
      // Essayer de trouver la position de l'erreur
      const posMatch = errorText.match(/line (\d+)/i);
      let excerpt = "";
      if (posMatch) {
        const lines = xmlContent.split("\n");
        const lineNum = parseInt(posMatch[1], 10) - 1;
        excerpt = lines.slice(Math.max(0, lineNum - 1), lineNum + 2).join("\n");
      } else {
        excerpt = xmlContent.substring(0, 500);
      }

      return { file: fileName, error: errorText.substring(0, 300), excerpt: excerpt.substring(0, 500) };
    }
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   JOURNALISATION DIAGNOSTIQUE
   ═══════════════════════════════════════════════════════════════ */

/**
 * Journalise des métriques de diagnostic sur les données fusionnées
 */
const logDiagnostics = (data: MailMergeData, templateName: string): void => {
  const metrics: Record<string, { length: number; newlines: number; hasRisk: boolean }> = {};

  for (const [key, val] of Object.entries(data)) {
    if (typeof val !== "string") continue;
    // eslint-disable-next-line no-control-regex
    const hasControlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(val);
    metrics[key] = {
      length: val.length,
      newlines: (val.match(/\n/g) || []).length,
      hasRisk: hasControlChars,
    };

    if (hasControlChars) {
      console.warn(`[framingMailMerge] ⚠️ Caractères de contrôle résiduels dans "${key}"`);
    }
  }

  const totalSize = Object.values(metrics).reduce((sum, m) => sum + m.length, 0);
  console.info(`[framingMailMerge] Diagnostic — template: "${templateName}", taille totale: ${totalSize} chars`, metrics);
};

/* ═══════════════════════════════════════════════════════════════
   CONSTRUCTION DES DONNÉES DE FUSION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Construit l'objet de données pour le publipostage à partir des données projet
 */
export const buildMailMergeData = (projectData: FramingProjectInput): MailMergeData => {
  const p = projectData.project || projectData;
  const framing = projectData.framing || {};
  const members = projectData.members || [];
  const risks = projectData.risks || [];
  const tasks = projectData.tasks || [];

  const orgParts = [p.pole_name, p.direction_name, p.service_name].filter(Boolean);
  const organisation = orgParts.length > 0 ? orgParts.join(" > ") : "Non définie";

  const equipe = members.length > 0
    ? members.map((m: FramingMember) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "Inconnu";
        return `${name} (${m.role || "Membre"})`;
      }).join("\n")
    : "Aucun membre";

  const risquesStr = risks.length > 0
    ? risks.map((r: FramingRisk, i: number) =>
        `${i + 1}. ${r.description || "Sans description"} - Probabilité: ${r.probability || "?"}, Sévérité: ${r.severity || "?"}, Statut: ${r.status || "?"}`
      ).join("\n")
    : "Aucun risque identifié";

  const tachesStr = tasks.length > 0
    ? tasks.map((t: FramingTask, i: number) => {
        const statusMap: Record<string, string> = { todo: "À faire", in_progress: "En cours", done: "Terminée" };
        return `${i + 1}. ${t.title || "Sans titre"} - ${statusMap[t.status ?? ""] || t.status || "?"}${t.assignee ? ` (${t.assignee})` : ""}`;
      }).join("\n")
    : "Aucune tâche";

  return {
    titre_projet: p.title || "Sans titre",
    code_projet: p.code || "",
    chef_projet: p.project_manager_name || p.project_manager || "Non défini",
    etat: translateLifecycleStatus(p.lifecycle_status),
    date_debut: formatDate(p.start_date),
    date_fin: formatDate(p.end_date),
    organisation,
    description: p.description || "",
    priorite: translatePriority(p.priority),
    avancement: `${p.completion || 0}%`,
    contexte: stripMarkdown(framing.context),
    objectifs: stripMarkdown(framing.objectives),
    parties_prenantes: stripMarkdown(framing.stakeholders),
    gouvernance: stripMarkdown(framing.governance),
    calendrier: stripMarkdown(framing.timeline),
    livrables: stripMarkdown(framing.deliverables),
    indicateurs_reussite: stripMarkdown(framing.success_indicators),
    equipe,
    risques: risquesStr,
    taches: tachesStr,
    date_generation: format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr }),
  };
};

/* ═══════════════════════════════════════════════════════════════
   MOTEUR DE RENDU (2 PASSES)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Options pour une passe de rendu
 */
interface RenderPassOptions {
  linebreaks: boolean;
  label: string;
  /** En mode safe, on aplatit les sauts de ligne en espaces */
  flattenNewlines: boolean;
}

/**
 * Tente un rendu docxtemplater avec les options données.
 * @returns le blob résultant, ou null si le XML produit est invalide
 */
const attemptRender = (
  templateZip: PizZip,
  data: MailMergeData,
  options: RenderPassOptions
): { blob: Blob; validationError: null } | { blob: null; validationError: { file: string; error: string; excerpt: string } } => {
  // Cloner le zip pour ne pas altérer l'original entre les passes
  const zipClone = new PizZip(templateZip.generate({ type: "uint8array" }));

  // Nettoyer les balises fractionnées
  cleanSplitTags(zipClone);

  // Préparer les données selon le mode
  const renderData = { ...data };
  if (options.flattenNewlines) {
    for (const key of Object.keys(renderData) as (keyof MailMergeData)[]) {
      if (typeof renderData[key] === "string") {
        renderData[key] = (renderData[key] as string).replace(/\n/g, " — ");
      }
    }
  }

  // Instancier docxtemplater avec nullGetter défensif
  const doc = new Docxtemplater(zipClone, {
    paragraphLoop: true,
    linebreaks: options.linebreaks,
    delimiters: { start: "{{", end: "}}" },
    // Retourner chaîne vide pour toute balise non trouvée dans les données
    nullGetter: () => "",
  });

  doc.render(renderData);

  // Récupérer le zip rendu et valider le XML
  const outputZip = doc.getZip();
  const xmlError = validateDocxXml(outputZip as unknown as PizZip);

  if (xmlError) {
    console.warn(`[framingMailMerge] ❌ Passe "${options.label}" — XML invalide dans ${xmlError.file}:`, xmlError.error);
    return { blob: null, validationError: xmlError };
  }

  console.info(`[framingMailMerge] ✅ Passe "${options.label}" — XML valide`);

  const blob = outputZip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });

  return { blob, validationError: null };
};

/* ═══════════════════════════════════════════════════════════════
   POINT D'ENTRÉE PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */

/**
 * Exécute le publipostage : télécharge le modèle, remplace les balises et déclenche le téléchargement.
 * Utilise une stratégie en 2 passes :
 *   1. Mode riche (linebreaks activés)
 *   2. Fallback safe (linebreaks désactivés, sauts de ligne aplatis)
 * Si les deux échouent, une erreur explicite est remontée.
 */
export const executeMailMerge = async (
  templateFilePath: string,
  projectData: FramingProjectInput,
  outputFileName: string = "note-de-cadrage.docx"
): Promise<void> => {
  // 1. Télécharger le fichier modèle depuis Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("framing-export-templates")
    .download(templateFilePath);

  if (downloadError || !fileData) {
    throw new Error(`Impossible de télécharger le modèle : ${downloadError?.message || "fichier introuvable"}`);
  }

  // 2. Charger le fichier avec PizZip
  const arrayBuffer = await fileData.arrayBuffer();
  const templateZip = new PizZip(arrayBuffer);

  // 3. Construire et sanitiser les données
  const rawData = buildMailMergeData(projectData);
  const data = sanitizeAllValues(rawData);

  // 4. Diagnostic
  logDiagnostics(data, templateFilePath);

  // 5. Stratégie de rendu en 2 passes
  const passes: RenderPassOptions[] = [
    { linebreaks: true, label: "riche", flattenNewlines: false },
    { linebreaks: false, label: "safe (sans linebreaks)", flattenNewlines: true },
  ];

  let finalBlob: Blob | null = null;
  let lastError: { file: string; error: string; excerpt: string } | null = null;

  for (const pass of passes) {
    try {
      const result = attemptRender(templateZip, data, pass);
      if (result.blob) {
        finalBlob = result.blob;
        break;
      }
      lastError = result.validationError;
    } catch (err: unknown) {
      console.error(`[framingMailMerge] ❌ Exception passe "${pass.label}":`, err);
      lastError = { file: "N/A", error: err instanceof Error ? err.message : String(err), excerpt: "" };
    }
  }

  if (!finalBlob) {
    const detail = lastError
      ? `Fichier: ${lastError.file}\nErreur: ${lastError.error}`
      : "Erreur inconnue";
    throw new Error(
      `L'export a échoué : le document généré contient du XML invalide.\n\n` +
      `Détails techniques :\n${detail}\n\n` +
      `Veuillez vérifier le modèle DOCX (zones de texte, révisions, objets complexes) ` +
      `ou contacter l'administrateur.`
    );
  }

  // 6. Déclencher le téléchargement
  const url = URL.createObjectURL(finalBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = outputFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
