
# Migration Gantt : gantt-task-react → SVAR React Gantt

## Statut : ✅ Terminé

## Résumé

Remplacement complet de `gantt-task-react` (non maintenu depuis 2021) par `@svar-ui/react-gantt` (MIT, activement maintenu, TypeScript natif, pure React).

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `package.json` | `gantt-task-react` supprimé, `@svar-ui/react-gantt` ajouté |
| `src/utils/gantt-helpers.ts` | Nouveau mapping `mapTasksToSvarFormat` (format ITask SVAR) |
| `src/utils/ganttExcelExport.ts` | Interface `ExportableTask` autonome, plus de dépendance gantt-task-react |
| `src/components/task/TaskGantt.tsx` | Réécrit avec composant SVAR `<Gantt>` + thème `<Willow>` |
| `src/components/gantt/ProjectGanttView.tsx` | Réécrit avec SVAR en mode readonly |
| `src/components/cart/ProjectGanttSheet.tsx` | Simplifié (plus de gestion manuelle expand/collapse) |
| `src/components/portfolio/PortfolioGanttSheet.tsx` | Simplifié idem |
| `src/components/gantt/GanttExportButtons.tsx` | Interface `GanttExportTask` autonome |
| `src/components/gantt/types.ts` | Nettoyé (plus de dépendance gantt-task-react) |
| `src/styles/gantt.css` | Remplacé par styles minimaux pour SVAR |

## Améliorations obtenues

- Drag & drop natif (déplacement, redimensionnement)
- Hiérarchie projet/tâche native (expand/collapse intégré)
- Échelles de temps configurables
- TypeScript complet
- Bibliothèque activement maintenue
