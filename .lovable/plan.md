

# Personnalisation du nom de fichier Excel Gantt

## Contexte

Actuellement, le fichier est nommé `gantt-{titre}-{date}.xlsx` avec le titre passé via `projectTitle`. Les appels depuis le portefeuille et le panier ne passent pas de `projectTitle`, ce qui donne un nom générique.

## Plan

### 1. Ajouter un prop `exportContext` à `TaskGantt`

Ajouter une prop optionnelle `exportContext?: 'project' | 'portfolio' | 'cart'` (défaut : `'project'`).

### 2. Adapter le nom de fichier dans `ganttExcelExport.ts`

Modifier la signature de `exportGanttToExcel` pour accepter un paramètre `context` et construire le nom :
- **project** : `gantt-{nomProjet}-{date}.xlsx`
- **portfolio / cart** : `gantt-projets-{date}.xlsx`

### 3. Passer le contexte depuis les appelants

| Fichier | Modification |
|---|---|
| `src/components/task/TaskGantt.tsx` | Ajouter prop `exportContext`, le transmettre à `exportGanttToExcel` |
| `src/utils/ganttExcelExport.ts` | Nouveau paramètre `context`, logique de nommage conditionnelle |
| `src/components/cart/ProjectGanttSheet.tsx` | Passer `exportContext="cart"` |
| `src/components/portfolio/PortfolioGanttSheet.tsx` | Passer `exportContext="portfolio"` |
| `src/components/TaskList.tsx` | Pas de changement (utilise déjà `projectTitle`, contexte par défaut `project`) |

### Détail technique

```typescript
// ganttExcelExport.ts – section téléchargement
const filePrefix = context === 'project' 
  ? `gantt-${sanitized(title)}` 
  : `gantt-projets`;
link.download = `${filePrefix}-${dateStr}.xlsx`;
```

