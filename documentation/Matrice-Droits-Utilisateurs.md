# Matrice des droits utilisateurs — METEOR

> Document d'audit synthétisant les droits attribués à chaque profil utilisateur.
> Source : code applicatif (`PermissionsContext`, hooks `use*Permissions`/`use*Access`),
> fonctions RPC Supabase et politiques RLS.
> Dernière mise à jour : juin 2026.

## 1. Rôles et principes

L'application définit **7 rôles** (enum `user_role`) :

| Rôle | Libellé | Attribution |
|---|---|---|
| `admin` | Administrateur | Manuelle (1er utilisateur créé = admin) |
| `chef_projet` | Chef de projet | Par défaut à l'inscription |
| `manager` | Manager | Manuelle, doublée d'affectations hiérarchiques (`manager_path_assignments`) |
| `membre` | Membre | Attribué automatiquement à tous les utilisateurs (`handle_new_user`) |
| `time_tracker` | Suivi d'activités | Manuelle |
| `portfolio_manager` | Gestionnaire de portefeuille | Manuelle |
| `quality_manager` | Responsable Qualité | Manuelle |

**Principes :**

- **Cumul de rôles** : un même utilisateur peut porter plusieurs rôles ; les droits s'additionnent.
- **Rôle implicite `membre`** : tous les utilisateurs l'ont par défaut.
- **Mode admin désactivable** : un admin peut basculer un switch (`adminRoleDisabled` dans `PermissionsContext`) pour simuler une session sans privilèges admin, sans modification BDD. Les RPC concernés (`get_accessible_projects_list_view_with_admin_mode`) reçoivent le drapeau.
- **Comptes désactivés** (`profiles.is_active = false`) : accès bloqué côté front, retirés des listes de sélection.
- **Périmètre Manager** : déterminé par `manager_path_assignments` joints à `hierarchy_paths` ; un manager voit tout projet dont le `path_string` commence par un chemin qui lui est affecté (héritage Pôle → Direction → Service).
- **Chef de projet secondaire** : entrée `project_members.role = 'secondary_manager'` ; mêmes droits qu'un chef de projet principal, sauf suppression du projet.
- **Lecture via portefeuille** : tout utilisateur référencé dans `portfolio_managers` (owner/manager/viewer) obtient une **lecture seule** des projets rattachés au portefeuille (`can_access_project_via_portfolio`).

Légende du tableau : ✅ = autorisé · ⚠️ = autorisé sous condition (voir notes) · ❌ = non autorisé · — = sans objet.

---

## 2. Matrice fonctionnelle — Projets

| Action | Admin | Chef de projet | Manager | Membre | Suivi activités | Gest. portefeuille | Resp. Qualité |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Voir la liste de tous les projets | ✅ | ❌ | ⚠️ son périmètre | ❌ | ❌ | ⚠️ projets de ses portefeuilles | ❌ |
| Voir le détail d'un projet | ✅ | ⚠️ si CP principal/secondaire, membre ou créateur | ⚠️ si projet dans son chemin | ⚠️ si membre | ❌ | ⚠️ lecture via portefeuille | ❌ |
| Créer un projet | ✅ | ✅ | ✅ (sur son périmètre) | ❌ | ❌ | ❌ | ❌ |
| Modifier un projet (titre, dates, organisation…) | ✅ | ⚠️ si CP principal/secondaire | ⚠️ si projet dans son chemin | ❌ | ❌ | ❌ | ❌ |
| Supprimer un projet | ✅ | ⚠️ si CP principal | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clôturer / Réactiver un projet | ✅ | ⚠️ si CP principal/secondaire | ⚠️ si projet dans son chemin | ❌ | ❌ | ❌ | ❌ |
| Gérer l'équipe (ajouter/retirer membres) | ✅ | ⚠️ si CP principal | ⚠️ si projet dans son chemin (`can_manage_project_team`) | ❌ | ❌ | ❌ | ❌ |
| Inviter un nouvel utilisateur | ✅ | ⚠️ sur ses projets | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer / modifier une revue de projet | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Consulter l'historique des revues | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ si membre | ❌ | ⚠️ via portefeuille | ❌ |
| Gérer les risques (CRUD) | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Consulter les risques | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ si membre | ❌ | ⚠️ via portefeuille | ❌ |
| Créer / modifier / supprimer des tâches | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ tâches qui lui sont assignées (statut/commentaire) | ❌ | ❌ | ❌ |
| Voir « Mes tâches » | ✅ | ✅ | ✅ | ✅ (tâches assignées) | ❌ | ✅ | ✅ |
| Cadrage projet — lecture | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ si membre | ❌ | ⚠️ via portefeuille | ❌ |
| Cadrage projet — édition | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Export DOCX / PDF du cadrage | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ si membre | ❌ | ⚠️ via portefeuille | ❌ |
| Génération IA (cadrage) | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Notes de projet | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ lecture si membre | ❌ | ⚠️ lecture via portefeuille | ❌ |
| Évaluation de projet (à la clôture) — création/modification | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Vue cross-projets « Évaluations » (`/evaluations`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (lecture globale via `is_quality_manager`) |
| Innovation (radar 5 axes) | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ lecture si membre | ❌ | ⚠️ lecture via portefeuille | ❌ |
| Gestion des tags projet | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Liens entre projets (master ↔ liés) | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ❌ | ❌ | ❌ | ❌ |
| Mode présentation du projet | ✅ | ⚠️ sur ses projets | ⚠️ sur son périmètre | ⚠️ lecture si membre | — | ⚠️ via portefeuille | — |
| Panier de projets + exports XLS / PPTX / Gantt consolidé / slideshow | ✅ | ⚠️ projets visibles | ⚠️ projets visibles | ⚠️ projets accessibles | ❌ | ⚠️ projets accessibles | ⚠️ projets accessibles |
| Favoris & projets récents | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |

---

## 3. Matrice fonctionnelle — Portefeuilles

| Action | Admin | Chef de projet | Manager | Membre | Suivi activités | Gest. portefeuille | Resp. Qualité |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Créer un portefeuille | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Modifier / supprimer un portefeuille | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ créateur ou rôle `owner`/`manager` (`can_manage_portfolio_simple`) | ❌ |
| Consulter un portefeuille | ✅ | ⚠️ si référencé `portfolio_managers` | ❌ | ⚠️ si référencé | ❌ | ✅ (owner/manager/viewer) | ❌ |
| Ajouter / retirer des projets dans un portefeuille | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ owner/manager (`can_assign_to_portfolio`) | ❌ |
| Gérer les membres d'un portefeuille (rôles owner/manager/viewer) | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ owner/manager (`can_insert_portfolio_manager`) | ❌ |
| Revue de portefeuille (CRUD) | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ owner/manager | ❌ |
| Mode présentation du portefeuille | ✅ | ⚠️ si référencé | ❌ | ⚠️ si référencé | ❌ | ✅ | ❌ |
| Export PPTX / XLS du portefeuille | ✅ | ⚠️ si référencé | ❌ | ⚠️ si référencé | ❌ | ✅ | ❌ |

---

## 4. Matrice fonctionnelle — Activités & profil

| Action | Admin | Chef de projet | Manager | Membre | Suivi activités | Gest. portefeuille | Resp. Qualité |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Saisir ses activités hebdomadaires (points / heures) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Import calendrier Microsoft (OAuth) / ICS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Types d'activités utilisables | ⚠️ tous | ⚠️ selon `activity_type_permissions` rattachées à son entité | idem | idem | idem | idem | idem |
| Tendance hebdomadaire et exports activités | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil + préférences UI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Évaluer l'application + relance périodique (snooze/opt-out) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications in-app + envoi feedback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Matrice — Administration

| Fonction d'administration | Admin | Autres rôles |
|---|:-:|:-:|
| Tableau de bord administrateur (`/admin`) | ✅ | ❌ |
| Gérer les utilisateurs (profils, désactivation, rôles) | ✅ | ❌ |
| Assistant d'affectation de droits en masse | ✅ | ❌ |
| Revue des droits utilisateurs + export Excel (`permissionsExport.ts`) | ✅ | ❌ |
| Gérer l'organisation (pôles, directions, services) | ✅ | ❌ |
| Gérer les chemins hiérarchiques + affectations managers | ✅ | ❌ |
| Gérer les modèles de projet (`project_templates`) + visibilité | ✅ | ❌ |
| Gérer les modèles d'export cadrage (DOCX) | ✅ | ❌ |
| Gérer les modèles d'email + file d'attente notifications | ✅ | ❌ |
| Gérer les types d'activités + permissions associées | ✅ | ❌ |
| Gérer les tokens API + scopes | ✅ | ❌ |
| Monitoring IA + prompts IA | ✅ | ❌ |
| Configuration SMTP / paramètres applicatifs | ✅ | ❌ |
| Statistiques d'usage + contenu | ✅ | ❌ |
| Gestion des notes app (`app_ratings`) + paramètres de relance | ✅ | ❌ |
| Gestion des évaluations projet (vue cross) | ✅ | ⚠️ `quality_manager` (lecture seule) |
| Gestion du feedback utilisateurs | ✅ | ❌ |
| Switch « Mode admin OFF » (tester en utilisateur standard) | ✅ | — |

---

## 6. Règles transverses

### 6.1 Périmètre Manager

```text
manager_path_assignments(user_id, path_id)
        │
        ▼
hierarchy_paths(path_string)
        │
        ▼  (préfixe)
projects.path_id → hierarchy_paths.path_string
```

Un manager affecté à un chemin de pôle voit tous les projets des directions et services de ce pôle (héritage descendant). Vérifié par `can_manager_access_project` et `can_access_project`.

### 6.2 Chef de projet secondaire

- Stocké comme `project_members.role = 'secondary_manager'`.
- Cumule les droits de gestion (revues, équipe, clôture, modifications) avec le chef de projet principal.
- Ne peut pas supprimer le projet.

### 6.3 Accès lecture seule via portefeuille

`can_access_project_via_portfolio(user_id, project_id)` retourne true si l'utilisateur est référencé dans `portfolio_managers` (n'importe quel rôle) pour un portefeuille contenant ce projet, **ou** s'il en est le créateur. Aucun droit d'écriture n'est accordé sur le projet via ce canal.

### 6.4 Comptes désactivés

`profiles.is_active = false` →
- Écran « Compte désactivé » + déconnexion forcée (`PermissionsContext`).
- Filtré dans `get_accessible_project_managers` et les listes de sélection (chef de projet, assignation de tâches, membres…).
- Les données historiques (revues, tâches, activités) sont préservées.

### 6.5 Mode admin désactivé

- État local React (`adminRoleDisabled` dans `PermissionsContext`), non persisté en BDD.
- `isAdmin = hasAdminRole && !adminRoleDisabled` ; toutes les vérifications côté front retombent au rôle réel non-admin.
- Côté BDD : la RPC `get_accessible_projects_list_view_with_admin_mode` reçoit `p_admin_mode_disabled` et filtre via les règles standards (CP, membre, manager hiérarchique).
- Réversible instantanément ; aucun impact sur les autres utilisateurs.

### 6.6 Responsable Qualité (`quality_manager`)

- Droits applicatifs identiques à un `membre` standard sur les projets.
- **Spécificité** : lecture globale de la table `project_evaluations` (RLS via `is_quality_manager`) et accès à la page `/evaluations` (analyse cross-projets).
- Ne donne aucun droit d'édition sur les projets.

### 6.7 Suivi d'activités (`time_tracker`)

- Profil dédié à la saisie d'activités hebdomadaires.
- N'accède pas aux projets, portefeuilles, tâches projet, risques.
- Peut utiliser l'import de calendrier et consulter ses tendances.

---

## 7. Annexe — Correspondance rôle ⇄ artefacts du code

| Rôle | Détection front | RPC / RLS principales |
|---|---|---|
| `admin` | `usePermissionsContext().isAdmin` | `has_role(uid, 'admin')` court-circuite `can_access_project` / `can_manage_project` / `can_view_portfolio` / `can_assign_to_portfolio` |
| `chef_projet` | `isProjectManager` + comparaison `projects.project_manager = profiles.email` | branche « CP » de `can_access_project` / `can_manage_project` ; `get_reviewable_projects` |
| `manager` | `isManager` + `useManagerProjectAccess` | `can_manager_access_project` via `manager_path_assignments` + `hierarchy_paths` |
| `membre` | `useUserProjectMemberships` (table `project_members`) | branche « membre » de `can_access_project` |
| `time_tracker` | `isTimeTracker` | `can_use_activity_type`, RLS `activities` |
| `portfolio_manager` | `usePortfolioRole`, `usePortfolioPermissions` | `can_view_portfolio`, `can_manage_portfolio_simple`, `can_assign_to_portfolio`, `can_access_project_via_portfolio` |
| `quality_manager` | `isQualityManager` | `is_quality_manager` (RLS `project_evaluations`) |

### Hooks de référence

- `src/contexts/PermissionsContext.tsx` — source unique des rôles et profil utilisateur.
- `src/hooks/useAdminModeAwareData.ts` — statut admin effectif (prend en compte le switch).
- `src/hooks/useProjectPermissions.tsx` — droits sur un projet donné.
- `src/hooks/useReviewAccess.tsx`, `useRiskAccess.tsx`, `useTaskAccess.tsx`, `useTaskPermissions.tsx` — droits par domaine.
- `src/hooks/useManagerPermissions.tsx`, `useManagerProjectAccess.tsx` — périmètre hiérarchique.
- `src/hooks/usePortfolioPermissions.ts`, `usePortfolioRole.ts` — droits portefeuille.
- `src/hooks/useVisibleProjects.ts` — source unique des projets visibles dans les listes.
- `src/utils/organizationAccess.ts`, `managerPermissions.ts`, `portfolioPermissions.ts` — utilitaires de calcul.

### Fonctions SQL clés

`has_role`, `is_quality_manager`, `can_access_project`, `can_manage_project`, `can_manage_project_team`, `can_manage_project_members`, `can_manage_project_organization`, `can_manager_access_project`, `can_view_portfolio`, `can_manage_portfolio_simple`, `can_assign_to_portfolio`, `can_insert_portfolio_manager`, `can_access_project_via_portfolio`, `is_portfolio_owner`, `can_use_activity_type`, `get_accessible_projects_list_view_with_admin_mode`, `get_accessible_project_managers`, `get_reviewable_projects`, `get_accessible_templates`.

---

*Ce document doit être mis à jour à chaque évolution des rôles ou des fonctions de permission. Une copie peut être exportée vers le SI documentaire de l'organisation à titre de référence d'audit.*
