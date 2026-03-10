

# Plan : Compléter les exports de la note de cadrage (PDF et DOCX)

## Constat

Les deux fichiers d'export de la note de cadrage codent en dur 6 sections de cadrage et ignorent le champ `success_indicators` récemment ajouté. Plus largement, toute future section ajoutée au cadrage serait également oubliée.

**Sections actuellement exportées** : contexte, objectifs, parties prenantes, gouvernance, calendrier, livrables.

**Section manquante** : indicateurs de réussite (`success_indicators`).

Les données sont déjà disponibles dans l'objet `framing` (type `Record<string, string | null>`), transmis aux fonctions d'export. Seul le rendu est absent.

## Modifications

### 1. `src/components/framing/ProjectFramingExport.tsx` (PDF)
Dans le composant `FramingSection`, ajouter un bloc pour `success_indicators` après le bloc `deliverables` (même pattern que les autres sections) :
```tsx
{framing.success_indicators && (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Indicateurs de réussite</Text>
    <View style={styles.sectionContent}>
      {markdownToPdfComponents(framing.success_indicators)}
    </View>
  </View>
)}
```

### 2. `src/components/framing/ProjectFramingExportDOCX.tsx` (DOCX)
Dans la fonction `generateProjectFramingDOCX`, ajouter un bloc pour `success_indicators` après le bloc `deliverables` (même pattern) :
```ts
if (framing.success_indicators) {
  sections.push(
    new Paragraph({
      text: 'Indicateurs de réussite',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    })
  );
  sections.push(...parseMarkdownToParagraphs(framing.success_indicators));
}
```

### Fichiers impactés
| Fichier | Modification |
|---------|-------------|
| `ProjectFramingExport.tsx` | Ajout section "Indicateurs de réussite" dans `FramingSection` |
| `ProjectFramingExportDOCX.tsx` | Ajout section "Indicateurs de réussite" dans le cadrage |

Deux modifications ponctuelles, aucun impact sur les types ou la base de données.

