

# Correction des bugs de navigation "Retour aux projets"

## Analyse

### Bug 1 : "Retour aux projets" ramène au dashboard (`/`) au lieu de la liste projets (`/projects`)

**Cause** : Les pages Tâches, Risques, Cadrage, Équipe, etc. utilisent toutes `navigate("/")` dans leur bouton retour. Or `/` pointe vers `Dashboard` et `/projects` pointe vers `Index` (liste des projets). Le libellé dit "Retour aux projets" mais la cible est le dashboard.

**Correction** : Remplacer `navigate("/")` par `navigate("/projects")` dans les boutons "Retour aux projets" des pages suivantes :
- `src/pages/TaskManagement.tsx` (ligne 102)
- `src/pages/RiskManagement.tsx` (lignes 69 et 87)
- `src/pages/ProjectFraming.tsx` (ligne 64)
- `src/pages/ProjectTeamManagement.tsx` (ligne 71)
- `src/pages/TeamActivities.tsx` (ligne 33)

Note : les pages Admin et EvaluationsManagement disent "Retour au tableau de bord" et pointent vers `/`, ce qui est correct — on ne les touche pas.

### Bug 2 : L'historique des revues depuis la liste projets ouvre une page avec "Retour au projet"

**Cause** : `ProjectActions.tsx` navigue vers `/reviews/${projectId}` (page `ReviewHistory.tsx`), et le bouton retour de cette page pointe vers `/projects/${projectId}` (synthèse projet). Depuis la liste projets, ce comportement est incohérent.

**Solution** : Reproduire le pattern déjà en place dans `LastReview.tsx` — ouvrir l'historique dans un **Dialog** (`ReviewHistoryDialog`) au lieu de naviguer vers une page.

**Modification dans `ProjectActions.tsx`** :
- Remplacer `navigateToHistory` (qui fait `navigate('/reviews/...')`) par un état local `showReviewHistory` + rendu du composant `ReviewHistoryDialog` existant.
- Le `ReviewHistoryDialog` gère déjà le focus, la suppression imbriquée, et le nettoyage des `pointer-events`.

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/pages/TaskManagement.tsx` | `navigate("/")` → `navigate("/projects")` |
| `src/pages/RiskManagement.tsx` | `navigate("/")` → `navigate("/projects")` (2 boutons retour) |
| `src/pages/ProjectFraming.tsx` | `navigate("/")` → `navigate("/projects")` |
| `src/pages/ProjectTeamManagement.tsx` | `navigate("/")` → `navigate("/projects")` |
| `src/pages/TeamActivities.tsx` | `navigate("/")` → `navigate("/projects")` |
| `src/components/project/ProjectActions.tsx` | Remplacer navigation `/reviews/...` par état local + `ReviewHistoryDialog` en popup |

