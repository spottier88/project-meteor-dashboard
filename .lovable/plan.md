

# Assistant de gestion des droits en masse

## Objectif

Ajouter un bouton "Gestion en masse" dans la page UserManagement qui ouvre un assistant (wizard) en 3 etapes pour ajouter ou supprimer un role a un ensemble d'utilisateurs selectionnes par nom ou par appartenance organisationnelle.

## Fichiers a creer

### `src/components/admin/BulkRoleWizard.tsx`
Composant principal : Dialog multi-etapes avec un state machine simple (`step: 1 | 2 | 3`).

**Etape 1 — Action et role**
- Radio : "Ajouter un droit" / "Supprimer un droit"
- Select : choix du role (admin, chef_projet, manager, membre, time_tracker, portfolio_manager, quality_manager)

**Etape 2 — Selection des utilisateurs**
- Deux modes via des Tabs :
  - **Nominatif** : liste des profils avec checkboxes, barre de recherche, bouton tout selectionner / deselectionner. Affiche le role actuel de chaque utilisateur. En mode "Ajouter", masquer ceux qui ont deja le role. En mode "Supprimer", ne montrer que ceux qui ont le role.
  - **Par organisation** : 3 selects en cascade (Pole → Direction → Service). Selectionner un niveau inclut tous les utilisateurs rattaches via `user_hierarchy_assignments` a ce niveau ou a ses sous-niveaux. Appel Supabase pour resoudre la liste d'utilisateurs concernes en temps reel (affichage du nombre d'utilisateurs trouves).
- Preview en bas : nombre d'utilisateurs selectionnes

**Etape 3 — Confirmation et execution**
- Resume : action (ajout/suppression), role concerne, liste nominative des utilisateurs impactes
- Bouton "Appliquer" : execution en batch (insert/delete sur `user_roles` pour chaque utilisateur)
- Barre de progression pendant l'execution
- Synthese finale : nombre de succes, erreurs eventuelles, bouton "Fermer"

### `src/hooks/useBulkRoleAssignment.ts`
Hook contenant la logique d'execution :
- `applyBulkRole(action, role, userIds)` : boucle sur les user_ids, insert ou delete dans `user_roles`, gere les doublons (constraint unique), retourne `{success: number, errors: string[]}`
- Invalidation des caches `users`, `userRoles` apres execution

## Fichier a modifier

### `src/pages/UserManagement.tsx`
- Ajouter un state `isBulkWizardOpen` et un bouton "Gestion en masse des droits" (icone `UsersRound` ou `ShieldCheck`) dans la barre d'actions en haut
- Importer et rendre `BulkRoleWizard`
- Appeler `handleFormSubmit` au succes pour rafraichir la liste

## Pas de modification de schema

Les tables `user_roles`, `profiles`, `user_hierarchy_assignments`, `poles`, `directions`, `services` existent deja. Toute la logique se fait avec des requetes existantes. L'admin a deja les droits RLS pour inserer/supprimer dans `user_roles`.

## Flux utilisateur

```text
[Bouton "Gestion en masse"]
        |
   Etape 1 : Ajouter/Supprimer  +  Choix du role
        |
   Etape 2 : Selection utilisateurs (nominatif OU par organisation)
        |
   Etape 3 : Resume → Appliquer → Synthese (X succes, Y erreurs)
```

