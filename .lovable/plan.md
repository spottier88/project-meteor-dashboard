

# Correction de l'alignement des colonnes et du rafraîchissement après drag & drop

## Problèmes identifiés

### 1. Colonnes décalées
L'en-tête du tableau ajoute une colonne vide `<TableHead className="w-8" />` quand le drag est actif (ligne 364), mais le composant `renderTaskCells` place la poignée de drag **à l'intérieur** de la cellule "Titre" (ligne 283) au lieu d'une cellule séparée. Résultat : l'en-tête a 8 colonnes, le corps 7 — tout est décalé d'une colonne.

### 2. Rafraîchissement absent après réordonnancement
L'appel `queryClient.invalidateQueries` fonctionne mais le composant ne reflète pas le changement car `sortedParentTasks` est recalculé à partir du prop `tasks` qui n'a pas encore été mis à jour. Il faut forcer un `refetchType: 'active'` et s'assurer que le composant attend la fin de la requête.

## Corrections dans `TaskTable.tsx`

### A. Séparer la poignée de drag dans sa propre cellule

Extraire le `<DragHandle>` de `renderTaskCells` et l'ajouter comme `<TableCell>` distincte dans le rendu des lignes (au même niveau que l'appel à `renderTaskCells`).

```
Avant (renderTaskCells) :
  <TableCell>
    {isDragEnabled && <DragHandle />}   ← dans la cellule Titre
    {titre...}
  </TableCell>

Après (dans le map des lignes) :
  {isDragEnabled && <TableCell className="w-8"><DragHandle /></TableCell>}
  <TableCell>                            ← cellule Titre seule
    {titre...}
  </TableCell>
```

Lignes impactées : retirer le `DragHandle` de `renderTaskCells` (ligne 283), et l'ajouter dans les 3 endroits où les lignes sont rendues (SortableRow parent, TableRow parent, TableRow enfant).

### B. Corriger le rafraîchissement

Remplacer `invalidateQueries` par `refetchQueries` pour forcer le rechargement immédiat des données, garantissant que le prop `tasks` est mis à jour :

```tsx
await queryClient.refetchQueries({ queryKey: ["tasks", tasks[0]?.project_id] });
```

### Fichier impacté

| Fichier | Modification |
|---|---|
| `src/components/task/TaskTable.tsx` | Séparation poignée drag en cellule dédiée + `refetchQueries` au lieu de `invalidateQueries` |

