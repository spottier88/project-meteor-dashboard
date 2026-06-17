# Création d'un document de synthèse des droits

Créer un nouveau fichier `documentation/Matrice-Droits-Utilisateurs.md` rassemblant la matrice des permissions par profil, basée sur l'analyse de :

- `src/contexts/PermissionsContext.tsx` (rôles, `hasRole`, mode admin OFF)
- Hooks `use*Permissions` / `use*Access` (projet, risque, tâche, revue, portefeuille, manager)
- `src/utils/organizationAccess.ts`, `managerPermissions.ts`, `portfolioPermissions.ts`
- Fonctions RPC Postgres : `can_access_project`, `can_manage_project`, `can_manage_project_team`, `can_view_portfolio`, `can_manage_portfolio_simple`, `can_assign_to_portfolio`, `can_access_project_via_portfolio`, `is_quality_manager`, `get_accessible_projects_list_view_with_admin_mode`, `get_accessible_project_managers`, `get_reviewable_projects`
- Politiques RLS des tables `projects`, `project_members`, `portfolio_managers`, `project_evaluations`, `tasks`, `risks`, `reviews`, etc.

## Contenu du document

1. **Introduction** — Objet du document, rappel des 7 rôles (`admin`, `chef_projet`, `manager`, `membre`, `time_tracker`, `portfolio_manager`, `quality_manager`), principe du cumul de rôles, mode admin désactivable.
2. **Matrice fonctionnelle — Projets** (création, modification, clôture, suppression, équipe, revues, risques, tâches, notes, cadrage, IA, innovation, tags, liens, panier, présentation, favoris).
3. **Matrice fonctionnelle — Portefeuilles** (CRUD, ajout projets, revues, rôles owner/manager/viewer).
4. **Matrice fonctionnelle — Activités & profil** (saisie hebdo, import calendrier, types d'activités, préférences).
5. **Matrice — Administration** (utilisateurs, organisation, modèles projet/email/export, IA, tokens API, statistiques, configuration SMTP).
6. **Règles transverses** :
   - Périmètre Manager via `manager_path_assignments` + héritage hiérarchique
   - Chef de projet secondaire (`project_members.role = 'secondary_manager'`)
   - Accès lecture seule via portefeuille (`can_access_project_via_portfolio`)
   - Blocage des comptes désactivés (`profiles.is_active = false`)
   - Mode admin OFF (RPC `..._with_admin_mode`)
7. **Annexe** — Correspondance rôle ⇄ principales fonctions du code (utile pour audit futur).

## Détails techniques

- Format : Markdown pur (tableaux GFM), aucune dépendance ajoutée.
- Emplacement : `documentation/Matrice-Droits-Utilisateurs.md` (cohérent avec les autres docs : `METEOR-Documentation-Complete.md`, `Guide-Utilisateur-V3-Ajouts.md`).
- Aucun changement de code applicatif, aucune migration SQL.
- Document destiné à l'audit et à la documentation interne ; pourra être mis à jour à la main lors d'évolutions des rôles.

## Hors périmètre

- Pas de page d'administration affichant la matrice (option non retenue).
- Pas d'export Excel automatique (option non retenue ; un export existe déjà pour la *revue des droits utilisateurs réels* via `permissionsExport.ts`).
