

# Historique des revues en Dialog au lieu d'une page séparée

## Problème
La navigation vers une page dédiée `/reviews/:projectId` crée une boucle de navigation : le bouton "Retour au projet" de l'historique ramène à la synthèse, mais le bouton "Retour" de la synthèse peut ramener à l'historique.

## Solution
Remplacer la navigation par une **Dialog** (modale) qui s'ouvre directement dans la page de synthèse du projet. L'historique des revues est affiché dans cette modale, sans changement de route.

## Modifications

### 1. Créer `src/components/review/ReviewHistoryDialog.tsx`
- Nouveau composant qui encapsule le contenu de l'historique dans un `Dialog` (shadcn).
- Props : `projectId: string`, `isOpen: boolean`, `onClose: () => void`.
- Réutilise la même requête Supabase que `ReviewHistory.tsx` (revues + actions).
- Inclut la suppression via `DeleteReviewDialog` existant (modale imbriquée AlertDialog, déjà gérée).
- Contenu scrollable (`max-h-[70vh] overflow-y-auto`).
- Gestion du focus à la fermeture : `onCloseAutoFocus` avec `e.preventDefault()` + reset `pointer-events` sur `document.body` (pattern existant dans le projet).

### 2. Modifier `src/components/LastReview.tsx`
- Remplacer le `navigate()` par un état local `showHistory` (boolean).
- Le bouton `History` ouvre la Dialog au lieu de naviguer.
- Supprimer l'import de `useNavigate`.
- Rendre `<ReviewHistoryDialog>` conditionnellement.

### 3. Conserver `ReviewHistory.tsx` et sa route
- La page reste accessible directement via URL pour d'éventuels liens externes ou bookmarks, mais n'est plus le chemin principal depuis la synthèse.

## Focus et pointer-events
Le `DialogContent` existant dans `dialog.tsx` a déjà `onCloseAutoFocus: e.preventDefault()`. Pour la modale imbriquée (DeleteReviewDialog utilisant AlertDialog), le pattern `onCloseAutoFocus` est aussi déjà en place dans `alert-dialog.tsx`. Aucun risque de perte de focus identifié.

