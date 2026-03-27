

# Corrections Gantt : ordre des tâches et export Excel des tâches parentes

## Problèmes identifiés

### 1. Ordre des tâches non respecté dans le Gantt

Dans `src/utils/gantt-helpers.ts`, la fonction `mapTasksToSvarFormat` (ligne 55) traite les tâches dans l'ordre du tableau reçu, sans tri par `order_index`. Le champ `order_index` est présent dans les données brutes mais n'est jamais utilisé pour ordonner les tâches avant le mapping SVAR.

### 2. Tâches parentes absentes de l'export Excel

Dans `src/utils/ganttExcelExport.ts`, ligne 178 :
```typescript
const filteredTasks = tasks.filter(t => t.type !== 'summary');
```
Ce filtre exclut toutes les tâches de type `summary`. Or, `mapTasksToSvarFormat` attribue le type `summary` à toute tâche ayant des enfants (ligne 88 de `gantt-helpers.ts`). Résultat : les tâches parentes sont supprimées de l'export.

## Plan de correction

### A. Tri par `order_index` dans `gantt-helpers.ts`

Ajouter `order_index` au type `RawGanttTask` et trier les tâches par `order_index` croissant au début de `mapTasksToSvarFormat`, avant le mapping.

```typescript
// Ajouter au type RawGanttTask
order_index?: number;

// Trier en début de fonction
const sorted = [...tasks].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
```

### B. Inclure les tâches parentes dans l'export Excel (`ganttExcelExport.ts`)

Supprimer le filtre `t.type !== 'summary'` (ligne 178) et le remplacer par un filtre qui exclut uniquement les projets (type `project` passé depuis `TaskGantt`). Ajouter une mise en forme distincte (gras, fond gris clair) pour les tâches parentes afin de les distinguer visuellement.

Modifier aussi le type `ExportableTask` pour inclure un champ `isParent` optionnel, et adapter `TaskGantt.tsx` pour passer cette information dans `exportData`.

### Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/utils/gantt-helpers.ts` | Ajout `order_index` au type + tri avant mapping |
| `src/utils/ganttExcelExport.ts` | Retrait du filtre `summary`, mise en forme des tâches parentes |
| `src/components/task/TaskGantt.tsx` | Propagation de `isParent` dans `exportData` |

