

# Analyse : Export DOCX corrompu avec modèles complexes

## Diagnostic

Le fichier uploadé contient bien du contenu (3 pages, tableaux, images, mise en forme riche), ce qui confirme que docxtemplater a effectué le remplacement mais a produit un XML interne invalide. Le fait que seuls les modèles complexes posent problème pointe vers **deux causes probables** :

### Cause 1 — Balises fractionnées dans le XML Word (très probable)

Dans un modèle Word complexe avec mise en forme (gras, couleur, police), Word fragmente souvent le texte en plusieurs "runs" XML internes. Par exemple, `{{titre_projet}}` peut être stocké comme :
```text
<w:r><w:t>{{titre_</w:t></w:r><w:r><w:t>projet}}</w:t></w:r>
```
Docxtemplater ne retrouve pas la balise complète, laisse des fragments `{{` ou `}}` dans le XML, et le fichier devient invalide. Un modèle simple (sans mise en forme sur les balises) n'a pas ce problème.

### Cause 2 — Compression ZIP manquante

La génération actuelle (`doc.getZip().generate()`) ne spécifie pas `compression: "DEFLATE"`. Certaines versions de Word (notamment sur poste Windows en entreprise) refusent d'ouvrir des DOCX non compressés.

---

## Plan de correction

### 1. Ajouter la compression DEFLATE à la génération ZIP

**Fichier** : `src/utils/framingMailMerge.ts` (lignes 191-194)

Ajouter l'option `compression` pour garantir la compatibilité :
```ts
const outputBlob = doc.getZip().generate({
  type: "blob",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  compression: "DEFLATE",
});
```

### 2. Activer le parser de balises fractionnées

Docxtemplater propose un module interne pour recombiner les balises fractionnées. Ajouter l'option `parser` personnalisé avec expressions angulaires simples, ou plus simplement utiliser les options intégrées :

```ts
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: "{{", end: "}}" },
  // Gestion des erreurs non bloquante
  errorLogging: false,
});
```

Et surtout, ajouter un **pré-traitement du ZIP** pour nettoyer les balises fractionnées dans le XML avant le rendu, via la fonction `InspectModule` ou en nettoyant manuellement les fichiers XML du template.

### 3. Approche pragmatique : nettoyage des runs XML

Ajouter une fonction `cleanTemplateXml` qui, avant d'instancier Docxtemplater, parcourt les fichiers XML du ZIP (`word/document.xml`, `word/header*.xml`, `word/footer*.xml`) et fusionne les runs contenant des fragments de balises `{{...}}`.

**Nouveau code dans `framingMailMerge.ts`** :

```ts
/**
 * Fusionne les runs XML fragmentés contenant des balises {{...}}
 * pour éviter la corruption du document final.
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
    // Regex : fusionne les balises {{...}} fractionnées entre plusieurs <w:t> 
    content = content.replace(
      /\{\{[^}]*(?:<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>)[^}]*\}\}/g,
      (match) => {
        // Extraire uniquement le texte, supprimer les tags XML intermédiaires
        const textOnly = match.replace(/<[^>]+>/g, "");
        return textOnly;
      }
    );
    zip.file(fileName, content);
  }
};
```

Cette fonction est appelée **après** `new PizZip(arrayBuffer)` et **avant** `new Docxtemplater(zip)`.

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/utils/framingMailMerge.ts` | Ajout `cleanSplitTags` + compression DEFLATE |

C'est une modification localisée (un seul fichier, ~30 lignes ajoutées) qui corrige les deux causes identifiées.

