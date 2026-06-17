# Correction : la liste des projets ne s'actualise pas après clôture

## Analyse

La page `/projects` consomme le hook `useProjectsListView` avec la clé `["projectsListView", ...]` et le dashboard utilise `["dashboardSummary", ...]`. Or `useProjectClosure.ts` (toutes les étapes : confirmation, méthode, évaluation, finalisation) n'invalide que `["project", id]`, `["projects"]`, `["lastReviews", id]`, `["projectAccess", id]` et `["projectEvaluation", id]`.

Résultat : après bascule du statut vers `terminé`, le cache de la vue liste/cartes reste servi tel quel (les données paraissent figées). Même symptôme côté dashboard. Le bug touche également :
- `ReactivateProjectButton.tsx` (réouverture)
- `DeleteProjectDialog.tsx` (suppression)
- `ProjectSummaryContent.tsx` (mise à jour ponctuelle)
- `usePortfolioDetails.ts` (ajout/retrait projet portefeuille)

Tous invalident `["projects"]` mais omettent `["projectsListView"]` et `["dashboardSummary"]`, contrairement à `useProjectSubmit` qui les invalide bien (référence du pattern correct).

## Plan

1. **`src/hooks/useProjectClosure.ts`** — Ajouter sur chacun des 4 blocs `onSuccess` (lignes ~144, ~244, ~305, ~418) les invalidations manquantes :
   - `["projectsListView"]`
   - `["dashboardSummary"]`

2. **`src/components/project/ReactivateProjectButton.tsx`** (~ligne 72) — Ajouter `["projectsListView"]` et `["dashboardSummary"]`.

3. **`src/components/project/DeleteProjectDialog.tsx`** (~ligne 90) — Ajouter `["projectsListView"]` et `["dashboardSummary"]`.

4. **`src/components/project/ProjectSummaryContent.tsx`** (~ligne 136) — Ajouter `["projectsListView"]` et `["dashboardSummary"]`.

5. **`src/hooks/usePortfolioDetails.ts`** (~lignes 191 et 244) — Ajouter `["projectsListView"]` et `["dashboardSummary"]` pour cohérence visuelle sur la page projets après modification de portefeuille.

## Validation

- TypeScript build OK.
- Test manuel : clôturer un projet depuis `/project/:id` → revenir sur `/projects` → vérifier que le statut "Terminé" est immédiatement affiché en vue tableau et vue cartes, sans rechargement manuel.
- Test manuel : réactiver un projet clôturé → idem.
- Test manuel : supprimer un projet → disparition immédiate de la liste.

## Hors périmètre

- Refonte du système de queryKeys (centralisation dans un fichier dédié).
- Migration vers `invalidateQueries({ predicate })` global.
