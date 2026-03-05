

# Correctif : Nom d'onglet Excel invalide

## Explication du bug

L'erreur `Sheet name cannot contain : \ / ? * [ ]` vient de la bibliothèque `xlsx`. Lors de l'export Excel depuis le panier, chaque projet génère un onglet dont le nom est le **titre du projet** (ligne 187 de `projectExport.ts`). Si un titre contient l'un des caractères interdits par Excel (`: \ / ? * [ ]`), l'export échoue.

Le code actuel tronque le titre à 31 caractères mais **ne nettoie pas les caractères spéciaux**.

## Correctif

### Fichier : `src/utils/projectExport.ts` (ligne 187)

Ajouter une fonction de nettoyage qui remplace les caractères interdits par un tiret :

```typescript
// Avant
const sheetName = (data.project.title || 'Projet').substring(0, 31);

// Après
const sanitizeSheetName = (name: string): string => {
  return name.replace(/[:\\\/\?\*\[\]]/g, '-').substring(0, 31);
};
const sheetName = sanitizeSheetName(data.project.title || 'Projet');
```

Un seul fichier modifié, une seule ligne corrigée.

