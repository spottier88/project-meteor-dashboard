/**
 * @module templateLinter
 * @description Analyse un fichier DOCX (modèle d'export) et produit un rapport
 * de compatibilité : détection de balises dans des zones à risque (text boxes,
 * révisions, champs complexes) et balises fragmentées non réparables.
 */

import PizZip from "pizzip";

/** Résultat d'un avertissement de lint */
export interface LintWarning {
  /** Sévérité : "error" bloque l'usage, "warning" est informatif */
  severity: "error" | "warning";
  /** Fichier XML source */
  file: string;
  /** Description du problème */
  message: string;
  /** Balise(s) concernée(s) */
  tags?: string[];
}

/** Résultat complet du lint */
export interface LintReport {
  /** Nombre total de balises détectées */
  totalPlaceholders: number;
  /** Liste des balises trouvées */
  placeholders: string[];
  /** Avertissements */
  warnings: LintWarning[];
  /** Template compatible (aucun "error") */
  isCompatible: boolean;
}

/** Liste des balises reconnues */
const KNOWN_PLACEHOLDERS = [
  "titre_projet", "code_projet", "chef_projet", "etat",
  "date_debut", "date_fin", "organisation", "description",
  "priorite", "avancement", "contexte", "objectifs",
  "parties_prenantes", "gouvernance", "calendrier",
  "livrables", "indicateurs_reussite", "equipe",
  "risques", "taches", "date_generation",
];

/**
 * Analyse un fichier DOCX (ArrayBuffer) et retourne un rapport de lint
 */
export const lintTemplate = async (file: File): Promise<LintReport> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new PizZip(arrayBuffer);

  const warnings: LintWarning[] = [];
  const allPlaceholders = new Set<string>();

  // Parcourir tous les fichiers XML du dossier word/
  const xmlFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/") && name.endsWith(".xml")
  );

  for (const fileName of xmlFiles) {
    const fileEntry = zip.file(fileName);
    if (!fileEntry) continue;

    const content = fileEntry.asText();

    // 1. Extraire le texte brut pour trouver les balises
    const plainText = content.replace(/<[^>]+>/g, "");
    const tagMatches = plainText.match(/\{\{(\w+)\}\}/g) || [];
    for (const tag of tagMatches) {
      const name = tag.replace(/\{\{|\}\}/g, "");
      allPlaceholders.add(name);
    }

    // 2. Détecter les balises dans des zones de texte (w:txbxContent)
    const textBoxRegex = /<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/g;
    let match;
    while ((match = textBoxRegex.exec(content)) !== null) {
      const boxContent = match[1].replace(/<[^>]+>/g, "");
      const boxTags = boxContent.match(/\{\{(\w+)\}\}/g);
      if (boxTags) {
        warnings.push({
          severity: "warning",
          file: fileName,
          message: `Balise(s) dans une zone de texte (text box) — risque de corruption lors du rendu multi-lignes.`,
          tags: boxTags.map((t) => t.replace(/\{\{|\}\}/g, "")),
        });
      }
    }

    // 3. Détecter les balises dans les révisions (suivi des modifications)
    const revisionRegex = /<w:(?:ins|del)\b[^>]*>([\s\S]*?)<\/w:(?:ins|del)>/g;
    while ((match = revisionRegex.exec(content)) !== null) {
      const revContent = match[1].replace(/<[^>]+>/g, "");
      const revTags = revContent.match(/\{\{(\w+)\}\}/g);
      if (revTags) {
        warnings.push({
          severity: "error",
          file: fileName,
          message: `Balise(s) dans une zone de révision (suivi des modifications activé) — le rendu sera corrompu. Acceptez ou refusez les révisions avant d'uploader le modèle.`,
          tags: revTags.map((t) => t.replace(/\{\{|\}\}/g, "")),
        });
      }
    }

    // 4. Détecter les balises fragmentées (partiellement dans des <w:t> séparés)
    // On cherche des {{ ou }} isolés (non appariés dans le même <w:t>)
    const wtContentRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    const textsInOrder: string[] = [];
    while ((match = wtContentRegex.exec(content)) !== null) {
      textsInOrder.push(match[1]);
    }
    const concatenated = textsInOrder.join("");
    // Vérifier s'il y a des balises dans le texte concaténé qui n'apparaissent
    // pas dans des <w:t> individuels
    const concatTags = concatenated.match(/\{\{(\w+)\}\}/g) || [];
    for (const tag of concatTags) {
      // Vérifier si ce tag apparaît entier dans au moins un <w:t>
      const existsComplete = textsInOrder.some((t) => t.includes(tag));
      if (!existsComplete) {
        const tagName = tag.replace(/\{\{|\}\}/g, "");
        warnings.push({
          severity: "warning",
          file: fileName,
          message: `Balise {{${tagName}}} fragmentée entre plusieurs runs XML — sera automatiquement fusionnée lors de l'export, mais peut poser problème dans certains cas.`,
          tags: [tagName],
        });
      }
    }

    // 5. Détecter les balises inconnues
    for (const tag of tagMatches) {
      const name = tag.replace(/\{\{|\}\}/g, "");
      if (!KNOWN_PLACEHOLDERS.includes(name)) {
        warnings.push({
          severity: "warning",
          file: fileName,
          message: `Balise {{${name}}} non reconnue — elle sera remplacée par une valeur vide.`,
          tags: [name],
        });
      }
    }
  }

  const placeholders = Array.from(allPlaceholders);
  const hasErrors = warnings.some((w) => w.severity === "error");

  return {
    totalPlaceholders: placeholders.length,
    placeholders,
    warnings,
    isCompatible: !hasErrors,
  };
};
