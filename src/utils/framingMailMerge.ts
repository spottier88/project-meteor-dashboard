/**
 * @module framingMailMerge
 * @description Logique de publipostage (mail merge) pour l'export de la note de cadrage.
 * Charge un modèle DOCX depuis Supabase Storage, remplace les balises par les données
 * du projet, et génère le fichier final à télécharger.
 */

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

/**
 * Formate une date ISO en chaîne lisible
 */
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "Non défini";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
};

/**
 * Traduit le statut du cycle de vie en libellé français
 */
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

/**
 * Traduit la priorité en libellé français
 */
const translatePriority = (priority?: string): string => {
  const map: Record<string, string> = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  };
  return map[priority || ""] || priority || "Non définie";
};

/**
 * Sanitise une chaîne pour injection dans un DOCX via docxtemplater.
 * - Normalise en NFC (caractères composés)
 * - Uniformise les retours à la ligne
 * - Remplace les espaces typographiques (insécable, fine insécable, etc.) par un espace standard
 * - Supprime les caractères interdits par la spécification XML 1.0
 */
const sanitizeForDocx = (value: string): string => {
  return value
    // Normalisation Unicode NFC
    .normalize("NFC")
    // Uniformiser les fins de ligne
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remplacer les espaces typographiques par un espace standard
    .replace(/[\u00A0\u202F\u2007\u2008\u2009\u200A\u200B]/g, " ")
    // Supprimer les caractères interdits XML 1.0
    // (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, surrogates, 0xFFFE, 0xFFFF)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g, "");
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
      (result as any)[key] = sanitizeForDocx(result[key] as string);
    }
  }
  return result;
};

/**
 * Nettoie le contenu Markdown en texte brut
 * (Docxtemplater gratuit ne gère que le texte brut)
 */
const stripMarkdown = (md?: string | null): string => {
  if (!md) return "";
  return md
    .replace(/#{1,6}\s?/g, "")        // titres
    .replace(/\*\*(.*?)\*\*/g, "$1")   // gras
    .replace(/\*(.*?)\*/g, "$1")       // italique
    .replace(/`(.*?)`/g, "$1")         // code inline
    .replace(/\n- /g, "\n• ")          // listes à puces
    .replace(/\n\d+\.\s/g, "\n• ")     // listes numérotées
    .trim();
};

/**
 * Fusionne les runs XML fragmentés contenant des balises {{...}}
 * Word peut découper une balise comme {{titre_projet}} en plusieurs <w:r>/<w:t>,
 * ce qui empêche docxtemplater de les reconnaître et corrompt le fichier final.
 */
const cleanSplitTags = (zip: PizZip): void => {
  const xmlFiles = [
    "word/document.xml",
    "word/header1.xml", "word/header2.xml", "word/header3.xml",
    "word/footer1.xml", "word/footer2.xml", "word/footer3.xml",
  ];

  for (const fileName of xmlFiles) {
    const file = zip.file(fileName);
    if (!file) continue;

    let content = file.asText();

    // Étape 1 : fusionner les runs consécutifs contenant des fragments de balises {{...}}
    // On cherche les séquences qui commencent par {{ et finissent par }} mais contiennent
    // des tags XML intermédiaires (<w:r>, <w:t>, etc.)
    const tagRegex = /\{\{(?:[^}]|<[^>]+>)*\}\}/g;
    content = content.replace(tagRegex, (match) => {
      if (!match.includes("<")) return match; // pas de XML fragmenté
      const textOnly = match.replace(/<[^>]+>/g, "");
      return textOnly;
    });

    zip.file(fileName, content);
  }
};

/**
 * Construit l'objet de données pour le publipostage à partir des données projet
 */
export const buildMailMergeData = (projectData: any): MailMergeData => {
  const p = projectData.project || projectData;
  const framing = projectData.framing || {};
  const members = projectData.members || [];
  const risks = projectData.risks || [];
  const tasks = projectData.tasks || [];

  // Construire la chaîne organisation
  const orgParts = [p.pole_name, p.direction_name, p.service_name].filter(Boolean);
  const organisation = orgParts.length > 0 ? orgParts.join(" > ") : "Non définie";

  // Formater la liste des membres de l'équipe
  const equipe = members.length > 0
    ? members.map((m: any) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "Inconnu";
        return `${name} (${m.role || "Membre"})`;
      }).join("\n")
    : "Aucun membre";

  // Formater la liste des risques
  const risquesStr = risks.length > 0
    ? risks.map((r: any, i: number) => 
        `${i + 1}. ${r.description || "Sans description"} - Probabilité: ${r.probability || "?"}, Sévérité: ${r.severity || "?"}, Statut: ${r.status || "?"}`
      ).join("\n")
    : "Aucun risque identifié";

  // Formater la liste des tâches
  const tachesStr = tasks.length > 0
    ? tasks.map((t: any, i: number) => {
        const statusMap: Record<string, string> = { todo: "À faire", in_progress: "En cours", done: "Terminée" };
        return `${i + 1}. ${t.title || "Sans titre"} - ${statusMap[t.status] || t.status || "?"}${t.assignee ? ` (${t.assignee})` : ""}`;
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

/**
 * Exécute le publipostage : télécharge le modèle, remplace les balises et déclenche le téléchargement
 */
export const executeMailMerge = async (
  templateFilePath: string,
  projectData: any,
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
  const zip = new PizZip(arrayBuffer);

  // 2b. Nettoyer les balises fractionnées dans le XML du template
  cleanSplitTags(zip);

  // 3. Instancier Docxtemplater
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  // 4. Construire les données, sanitiser et effectuer le remplacement
  const rawData = buildMailMergeData(projectData);
  const data = sanitizeAllValues(rawData);

  // 4b. Diagnostic : journaliser les champs contenant des codepoints à risque
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string" && /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(val)) {
      console.warn(`[framingMailMerge] Caractères de contrôle résiduels dans le champ "${key}"`);
    }
  }

  doc.render(data);

  // 5. Générer le blob final
  const outputBlob = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });

  // 6. Déclencher le téléchargement
  const url = URL.createObjectURL(outputBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = outputFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
