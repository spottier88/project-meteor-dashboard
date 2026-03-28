

# Export Excel Gantt : arborescence parent-enfant

## Probleme

L'export Excel produit une liste plate triee par `order_index` global. Les taches filles ne sont pas regroupees sous leur tache mere — elles apparaissent a leur position d'index sans lien visuel avec le parent.

## Cause

Dans `TaskGantt.tsx` (ligne 207), `exportData` est construit par un simple `svarTasks.map(...)` qui conserve l'ordre plat du tri par `order_index`. Il n'y a aucune logique de regroupement hierarchique ni d'indentation pour les sous-taches.

De plus, `ExportableTask` ne porte pas l'information `parent` ni `id`, ce qui empeche tout tri hierarchique dans `ganttExcelExport.ts`.

## Plan de correction

### 1. Enrichir `ExportableTask` avec les champs hierarchiques

Dans `ganttExcelExport.ts`, ajouter a l'interface :

```typescript
export interface ExportableTask {
  id?: string;
  parentId?: string | null;
  // ... champs existants
  level?: number; // 0 = racine, 1 = enfant
}
```

### 2. Ordonner les taches en arborescence avant le rendu Excel

Ajouter une fonction `buildHierarchicalOrder` dans `ganttExcelExport.ts` qui :
- Separe les taches racines (sans `parentId`) des taches filles
- Trie les racines par leur position dans le tableau (deja triees par `order_index`)
- Insere les enfants juste apres leur parent, tries par `order_index`
- Attribue un `level` (0 pour parent, 1 pour enfant)

### 3. Indenter visuellement les taches filles dans l'Excel

Dans la boucle de rendu des lignes :
- Taches de niveau 0 (parentes) : prefixe `▸`, gras, fond gris clair (comportement actuel)
- Taches de niveau 1 (filles) : prefixe avec espaces d'indentation (`    ↳ nom`), police normale

### 4. Propager `id` et `parentId` depuis `TaskGantt.tsx`

Modifier `exportData` dans `TaskGantt.tsx` pour inclure :

```typescript
const exportData = svarTasks.map(t => ({
  id: String(t.id),
  parentId: t.parent ? String(t.parent) : null,
  name: t.text || '',
  // ... reste inchange
}));
```

## Fichiers impactes

| Fichier | Modification |
|---|---|
| `src/utils/ganttExcelExport.ts` | Interface enrichie, tri hierarchique, indentation visuelle |
| `src/components/task/TaskGantt.tsx` | Propagation de `id` et `parentId` dans `exportData` |

## Resultat attendu

```text
▸ Tache parente A          (gras, fond gris)
    ↳ Sous-tache A.1       (indentee)
    ↳ Sous-tache A.2       (indentee)
▸ Tache parente B          (gras, fond gris)
    ↳ Sous-tache B.1       (indentee)
Tache simple C             (normal)
```

