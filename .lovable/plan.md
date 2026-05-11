## Contexte

Aujourd'hui, sur l'écran "Gestion des affectations hiérarchiques" d'un utilisateur (`/admin/users/:userId/assignments`), l'administrateur doit choisir manuellement un chemin hiérarchique dans une longue liste déroulante de tous les chemins existants — alors que dans la grande majorité des cas, le manager doit avoir des droits exactement sur sa propre affectation (et éventuellement les chemins enfants qui en dépendent).

Les affectations propres de l'utilisateur sont déjà stockées dans `user_hierarchy_assignments` (entity_type = pole / direction / service). Cette information est sous-utilisée.

## Objectif

Rendre l'écran d'affectation des droits hiérarchiques quasi "1-clic" lorsque le rôle manager et l'affectation hiérarchique de l'utilisateur sont déjà renseignés.

## Évolutions proposées (UI uniquement, pas de modèle de données)

### 1. Bloc "Suggestions" en haut de l'écran

Au-dessus du formulaire actuel, ajouter une carte **"Affectations suggérées"** qui apparaît seulement si :
- l'utilisateur a le rôle `manager` (lecture via `user_roles`),
- ET il a au moins une entrée dans `user_hierarchy_assignments`.

Pour chaque affectation hiérarchique de l'utilisateur, on calcule à la volée le ou les `hierarchy_paths` correspondants :
- entity_type = service → 1 chemin exact (pôle/direction/service),
- entity_type = direction → chemin de la direction + (option) tous ses services,
- entity_type = pole → chemin du pôle + (option) toutes ses directions/services.

Chaque suggestion est affichée sous forme de ligne avec :
- le `path_string` (ex. "DSI / Études / Applicatif"),
- un badge "Déjà affecté" si la ligne existe déjà dans `manager_path_assignments`,
- un bouton **Ajouter** (désactivé si déjà affecté).

Deux actions globales en haut du bloc :
- **"Tout ajouter"** : insère en une fois toutes les suggestions non encore affectées.
- **"Ajouter mon affectation directe uniquement"** : n'insère que le chemin strictement égal à l'affectation de l'utilisateur (cas le plus fréquent / le plus restrictif).

### 2. Pré-sélection dans le formulaire manuel existant

Le formulaire `HierarchyPathAssignmentForm` (sélecteur de chemin) est conservé pour les cas atypiques, mais :
- son `Select` est pré-positionné par défaut sur le chemin correspondant à l'affectation directe de l'utilisateur (si elle existe),
- les chemins déjà affectés sont marqués (texte grisé + suffixe "(déjà affecté)") et non sélectionnables, ce qui évite les erreurs 23505.

### 3. Améliorations ergonomiques complémentaires

- **Rappel contextuel** : afficher en en-tête de page le rôle de l'utilisateur et son affectation directe (ex. "Manager • Pôle DSI / Direction Études / Service Applicatif"), avec un lien "Modifier l'affectation" qui pointe vers la fiche utilisateur si l'admin doit la corriger avant d'attribuer les droits.
- **Avertissement si manquant** : si l'utilisateur n'a pas le rôle manager ou pas d'affectation, afficher un message d'aide explicite ("Renseignez d'abord le rôle Manager et l'affectation hiérarchique pour bénéficier des suggestions") au lieu du bloc Suggestions.
- **Suppression en masse** : ajouter un bouton "Tout supprimer" sur la carte "Affectations existantes" (avec confirmation), utile lorsqu'on change un manager de périmètre.

## Détails techniques

- **Aucune migration** nécessaire. Toutes les données existent déjà :
  - `user_roles` pour le rôle manager,
  - `user_hierarchy_assignments` pour l'affectation directe,
  - `hierarchy_paths` pour les chemins disponibles,
  - `manager_path_assignments` pour les affectations existantes.

- Nouveau hook `useSuggestedManagerPaths(userId)` (`src/hooks/`) :
  - charge en parallèle `user_roles`, `user_hierarchy_assignments`, `hierarchy_paths`, `manager_path_assignments` (déjà fait au niveau page, on factorise),
  - retourne `{ isManager, directAssignment, suggestions: Array<{ path, isAlreadyAssigned, isDirect }> }`,
  - logique de matching : pour chaque assignment utilisateur, filtrer `hierarchy_paths` selon entity_type :
    - service → `service_id = entity_id`,
    - direction → `direction_id = entity_id` (un seul chemin) + enfants (`service_id IS NULL OR direction_id = entity_id`),
    - pole → `pole_id = entity_id` + enfants.

- Nouveau composant `SuggestedHierarchyPathsCard` (`src/components/manager/`) consommant ce hook et utilisant la même mutation `addAssignment` que la page actuelle (mutation déplacée dans la page ou exposée via props).

- Mutation d'ajout en masse : `Promise.all` sur les `insert`, gestion silencieuse de l'erreur 23505 (déjà affecté) pour ne pas bloquer le batch.

- Mutation "Tout supprimer" : `delete` filtré sur `user_id` dans `manager_path_assignments`, avec `AlertDialog` de confirmation.

- `HierarchyPathAssignmentForm` reçoit en plus la liste `assignedPathIds` pour griser les options déjà attribuées et un `defaultPathId` pour la pré-sélection.

## Ce qui ne change pas

- Le schéma de base et les RLS.
- La logique de permission côté projets (`canManagerAccessProject`, `manager_path_assignments`).
- La page de gestion des affectations utilisateur (`user_hierarchy_assignments`) — uniquement consommée en lecture.
- Le reste de l'application (gestion utilisateurs, projets, portefeuilles, etc.).
