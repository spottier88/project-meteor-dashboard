# Implémentation des lots 1 & 2 (10 findings)

Plan prêt à exécuter. Approuvez pour basculer en mode build et lancer les corrections.

## Lot 1 — Critiques

**F-01 · Double toast à la sauvegarde projet** — `src/pages/ProjectSummary.tsx`
Retirer le toast et le try/catch redondants dans `handleProjectFormSubmit`. `useProjectSubmit` affiche déjà les toasts succès/erreur et invalide les caches. On conserve seulement `refetchProject()` pour rafraîchir la query locale.

**F-02 · Bypass d'accès après "Continuer quand même"** — `src/hooks/useProjectFormSubmit.tsx`
Wrapper `handleCancelSubmit` pour remettre `isProceedingAnyway = false` quand l'utilisateur annule, en plus de la réinitialisation déjà présente après soumission.

**F-03 · Cache obsolète après création de revue** — `src/components/review/ReviewSheet.tsx`
Ajouter dans l'`onSubmit` l'invalidation parallèle de : `["project", projectId]`, `["lastReview", projectId]`, `["lastReviews", projectId]`, `["projectsListView"]`, `["dashboardSummary"]` (en plus de `["projects"]`).

**F-04 · Page blanche à l'expiration de session** — `src/contexts/PermissionsContext.tsx`
Remplacer `return null` par une redirection `window.location.replace("/login")` + écran transitoire « Redirection… ».

## Lot 2 — Majeurs

**F-05 · `window.confirm` dans suppression de membre** — `src/components/project/TeamMembersTable.tsx` + `src/hooks/useTeamManagement.tsx`
Retirer `window.confirm` de `handleDelete`. Ajouter dans le composant appelant un `AlertDialog` Radix piloté par un état `memberToDelete` (modèle MyTasks.tsx). Le hook expose désormais directement `deleteMember(memberId)`.

**F-06 · Double chargement de `user_roles`** — `src/hooks/useProjectPermissions.tsx`
Supprimer la `useQuery` locale `["userRoles", userProfile?.id]`. Récupérer `userRoles` depuis `usePermissionsContext()` et calculer `isProjectManager`/`isManager` à partir de cette source unique.

**F-07 · Filtre MyTasks non re-synchronisé depuis l'URL** — `src/pages/MyTasks.tsx`
Ajouter un `useEffect` qui écoute `location.search` et met à jour `showOverdueOnly` quand le paramètre `?filter=overdue` change (afin que les liens du dashboard fonctionnent même si la page est montée).

**F-08 · `useProjectSubmit` n'invalide pas les permissions** — `src/hooks/useProjectSubmit.tsx`
Ajouter dans le bloc « mise à jour » et à la fin du flow : `["projectAccess", project.id]` et `["dashboardSummary"]`.

**F-09 · Mutations membres n'invalident pas `projectAccess`** — `src/hooks/useTeamManagement.tsx`
Dans les `onSuccess` de `deleteMutation` et `updateRoleMutation`, ajouter l'invalidation de `["projectAccess", projectId]` (en plus de `["projectMembers", projectId]`).

**F-10 · Fuites `sessionStorage` ouverture nouvel onglet** — `src/hooks/useProjectNavigation.ts`
Ajouter un TTL de 60 s sur les entrées `project_navigation_*` et un nettoyage des clés expirées avant chaque écriture.

## Validation

- Vérification que le build TypeScript passe (le harness le fait automatiquement après chaque édition).
- Tests manuels suggérés : sauvegarde de projet (un seul toast), création de revue (météo dashboard à jour), expiration de session (redirection au lieu de page blanche), suppression d'un membre (AlertDialog), clic « Tâches en retard » depuis le dashboard.

## Hors périmètre (lot 3, à traiter ensuite)

F-11 (roleHierarchy), F-12 (ReviewSheet completion à 0), F-13 (navigate(-1)), F-14 (tri localeCompare), F-15 (queryKey déterministe).
