

# Montée de version : react-google-charts v4→v5 et @svar-ui/react-gantt 2.5→2.6

## 1. react-google-charts v4 → v5

### Constat
La dépendance `react-google-charts@^4.0.7` est présente dans `package.json` mais **n'est importée dans aucun fichier** du projet. Tous les graphiques utilisent `recharts`. C'est une dépendance morte.

### Action
- **Supprimer** `react-google-charts` de `package.json` au lieu de la monter en v5
- Aucun fichier à modifier, aucun impact fonctionnel

### Fichier impacté
- `package.json` uniquement

---

## 2. @svar-ui/react-gantt 2.5 → 2.6

### Nouveautés v2.6
- Action `filter-tasks` pour filtrer les tâches
- Correction du scroll via `scroll-chart`
- Fix de positionnement des liens dans les exports PNG/PDF
- Aucun breaking change documenté entre 2.5 et 2.6

### Fichiers utilisant SVAR Gantt (3 fichiers)

| Fichier | Usage |
|---|---|
| `src/components/task/TaskGantt.tsx` | Gantt interactif (projet) |
| `src/components/gantt/ProjectGanttView.tsx` | Gantt multi-projets (lecture seule) |
| `src/utils/gantt-helpers.ts` | Helpers de transformation (`ITask`) |

### Modifications nécessaires

**Aucune modification de code requise** pour la montée en v2.6 — pas de breaking changes.

**Correction opportuniste** : `ProjectGanttView.tsx` utilise le format date-fns (`MMMM yyyy`, `dd MMM`) dans `SCALES_CONFIG`, alors que le format SVAR locale (`%F %Y`, `%d %M`) est requis depuis v2.4.3. `TaskGantt.tsx` utilise déjà le bon format. Il faut aligner `ProjectGanttView.tsx` :

```
Avant : format: 'MMMM yyyy'  →  Après : format: '%F %Y'
Avant : format: 'd'          →  Après : format: '%j'
Avant : format: 'dd MMM'     →  Après : format: '%d %M'
Avant : format: 'yyyy'       →  Après : format: '%Y'
Avant : format: 'MMMM'       →  Après : format: '%F'
```

### Étapes

1. Mettre à jour `@svar-ui/react-gantt` de `^2.5.2` à `^2.6.0` dans `package.json`
2. Corriger les formats de scales dans `ProjectGanttView.tsx` (aligner sur le format SVAR utilisé dans `TaskGantt.tsx`)
3. Supprimer `react-google-charts` de `package.json`

### Impact

- Aucun breaking change pour la montée SVAR
- La correction des formats de scales dans `ProjectGanttView` corrige un bug potentiel d'affichage des labels de dates
- La suppression de `react-google-charts` réduit le bundle (~270 KB)

