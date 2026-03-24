

# Correction de l'erreur SVAR Gantt "Cannot read properties of null (reading 'forEach')"

## Cause

Le composant `<Gantt>` de SVAR requiert une prop `links` (tableau de dépendances entre tâches). Quand elle n'est pas fournie, la bibliothèque tente d'itérer sur `null` en interne, provoquant le crash.

## Correction

Ajouter `links={[]}` sur chaque instance de `<Gantt>` dans les 3 fichiers concernés :

| Fichier | Ligne |
|---|---|
| `src/components/task/TaskGantt.tsx` | L.182-189 |
| `src/components/gantt/ProjectGanttView.tsx` | L.184-189 |

Et les 2 sheets qui utilisent `TaskGantt` (aucun changement car ils passent par `TaskGantt`).

### Modification concrète

Dans `TaskGantt.tsx` :
```tsx
<Gantt
  tasks={svarTasks}
  links={[]}
  scales={SCALES_CONFIG[viewMode]}
  ...
/>
```

Dans `ProjectGanttView.tsx` :
```tsx
<Gantt
  tasks={svarTasks}
  links={[]}
  scales={SCALES_CONFIG[viewMode]}
  ...
/>
```

2 lignes ajoutées, 2 fichiers modifiés. Aucun impact fonctionnel.

