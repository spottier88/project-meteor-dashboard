
# Plan de correction — navigation bloquée sur l’écran “Tous les projets”

## Diagnostic retenu
Ce n’est très probablement plus un bug React Router pur.

Sur `/projects`, trois mécanismes différents cassent en même temps :
- `Link` : bouton `Retour` dans `DashboardHeader`
- `navigate()` : bouton `Administration` dans `UserInfo`
- clic ligne/carte : `useProjectNavigation` depuis `ProjectTableRow` / `ProjectCard`

Comme ces 3 chemins sont différents, le point commun n’est pas le helper de navigation mais l’écran lui-même : un verrou d’interaction laissé par les composants Radix de cette page (overlay invisible, focus-lock, `pointer-events` résiduels).

La page `/projects` est la plus exposée car elle cumule :
- `ProjectCart` (sheet) dans `DashboardHeader`
- `ProjectForm`, `ProjectSelectionSheet`, `ReviewSheet` via `ProjectModals`
- un `ProjectActions` par ligne/carte, avec `DropdownMenu` + dialogs associés

Plusieurs de ces composants n’ont pas de nettoyage homogène à la fermeture, alors que le projet contient déjà des correctifs manuels du même type ailleurs (`pointer-events` / focus). Avec React Router v7 et ses transitions asynchrones, ce verrou devient plus visible.

Je ne prévois donc pas de réécrire la logique de `ProjectTableRow`, `ProjectCard`, `DashboardHeader` ou `UserInfo` : ils ne sont pas la cause racine.

## Modifications à mettre en œuvre

### 1. Centraliser le nettoyage des verrous d’interaction
Créer un helper partagé de type `resetInteractionLocks()` pour :
- vider `document.body.style.pointerEvents`
- vider `document.documentElement.style.pointerEvents`
- restaurer le focus sur `document.body`

L’appliquer dans les primitives de base :
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/alert-dialog.tsx`

Objectif : ne plus dépendre de correctifs dispersés composant par composant.

### 2. Corriger les composants montés sur `/projects`
Remplacer les `onOpenChange={onClose}` trop implicites par un handler explicite :
- `onOpenChange={(open) => { if (!open) { resetInteractionLocks(); onClose(); } }}`

À faire en priorité sur :
- `src/components/cart/ProjectCart.tsx`
- `src/components/ProjectSelectionSheet.tsx`
- `src/components/review/ReviewSheet.tsx`
- `src/components/profile/ProfileForm.tsx`
- `src/components/project/LinkProjectDialog.tsx`
- `src/components/notifications/RequiredNotificationDialog.tsx`

### 3. Rendre les dropdowns non bloquants
Configurer `modal={false}` là où le menu sert surtout à lancer des actions/navigation :
- `src/components/project/ProjectActions.tsx`
- `src/components/notifications/UserNotificationsDropdown.tsx`

C’est cohérent avec le pattern déjà utilisé dans le projet pour éviter les blocages de `pointer-events`.

### 4. Ajouter un filet de sécurité au niveau route
Ajouter un cleanup léger au changement de `pathname` :
- dans `src/components/ProtectedRoute.tsx` ou un petit composant dédié monté sous le Router

But :
- nettoyer tout verrou résiduel laissé par une fermeture incomplète
- sécuriser les transitions RRv7

### 5. Harmoniser les derniers handlers de navigation
Appliquer le nettoyage secondaire restant :
- `src/hooks/useProjectNavigation.ts` : `void navigate(projectUrl)` sur la navigation interne
- vérifier les derniers `navigate(...)` appelés depuis les actions projets

Ce n’est pas la cause principale, mais cela enlève un facteur parasite.

## Pourquoi cela explique bien le bug
- `Retour`, `Administration` et clic projet utilisent des mécanismes différents mais échouent tous sur le même écran ;
- le seul point commun solide est la couche d’interaction locale à `/projects` ;
- cette page monte beaucoup plus de sheets/dialogs/dropdowns que les autres, donc c’est le meilleur candidat pour un verrou UI résiduel.

## Écrans à auditer aussi
Le même bug peut se reproduire ailleurs sur des pages qui utilisent les mêmes primitives :
- tableau de bord (`UserInfo`, profil, notifications)
- pages portefeuille avec dialogs/forms
- pages projet avec suppression / liaison / clôture
- pages tâches / notes

## Vérifications à faire après correction
1. Depuis `/projects` :
   - bouton `Retour`
   - bouton `Administration`
   - clic sur une carte projet
   - clic sur une ligne du tableau
   - actions du menu projet (`tâches`, `risques`, `cadrage`, `équipe`)
2. Refaire ces tests après :
   - ouverture/fermeture du panier
   - ouverture/fermeture du profil
   - ouverture/fermeture d’une notification
   - ouverture/fermeture d’un historique de revue
3. Vérifier que le dashboard et les pages portefeuille restent navigables.

## Fichiers principalement impactés
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/cart/ProjectCart.tsx`
- `src/components/project/ProjectActions.tsx`
- `src/components/project/LinkProjectDialog.tsx`
- `src/components/ProjectSelectionSheet.tsx`
- `src/components/review/ReviewSheet.tsx`
- `src/components/profile/ProfileForm.tsx`
- `src/components/notifications/UserNotificationsDropdown.tsx`
- `src/components/notifications/RequiredNotificationDialog.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useProjectNavigation.ts`
