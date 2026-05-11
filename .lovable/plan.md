# Plan — Désactivation d'utilisateurs

## Objectif
Permettre à un administrateur de marquer un utilisateur comme **inactif** depuis sa fiche dans l'administration. Un utilisateur inactif :
- ne peut plus être sélectionné dans les listes (tâches, équipes, notifications, managers, portefeuilles, chef de projet…),
- reste visible dans l'historique (données existantes préservées : tâches assignées, revues, activités…),
- apparaît clairement comme inactif dans la gestion des utilisateurs (badge + filtre).

Le champ `is_active` (boolean, défaut `true`) est ajouté à la table `profiles`. Aucune suppression de compte n'est effectuée.

---

## Phase 1 — Socle base de données & administration

### 1.1 Migration BDD
- Ajouter `is_active boolean NOT NULL DEFAULT true` à `public.profiles`.
- Backfill : tous les profils existants → `true`.
- Index partiel `WHERE is_active = true` pour optimiser les listes de sélection.
- Pas de modification des RLS existantes (la désactivation est un filtre applicatif, pas un retrait d'accès — l'utilisateur reste authentifié et peut consulter ce qu'il a déjà).

### 1.2 Fiche utilisateur (admin)
- `UserForm.tsx` + `UserFormFields.tsx` : ajout d'un **Switch "Compte actif"** (visible uniquement en mode édition, réservé aux admins).
- Persistance via `UPDATE profiles SET is_active = ...`.
- `UserManagement.tsx` :
  - Colonne / badge "Inactif" dans la liste.
  - Filtre toggle "Afficher les inactifs" (caché par défaut, persistance localStorage).
  - Action rapide "Désactiver / Réactiver" depuis la ligne.

### 1.3 Type & helpers
- Étendre `UserProfile` (`src/types/user.ts`) avec `is_active: boolean`.
- Créer un petit utilitaire `filterActiveUsers(users)` pour usage partagé.

**Livrable Phase 1 :** un admin peut activer/désactiver un compte ; la liste admin distingue les inactifs. Aucun autre écran n'est encore filtré.

---

## Phase 2 — Filtrage dans les listes de sélection

Tous les endroits où l'on **propose** un utilisateur doivent exclure les inactifs. Inventaire identifié :

| Zone | Fichier(s) |
|---|---|
| Assignation de tâche | `useTaskFormData.tsx`, `TaskCard.tsx`, `TaskTable.tsx` |
| Membres de projet / équipe | `InviteMemberForm.tsx`, `TeamMemberForm.tsx`, `ProjectTeamManagement` |
| Chef de projet (form projet) | `ProjectFormStep5.tsx`, `useProjectFormState.tsx`, `form/useProjectFormState.tsx` |
| Notifications ciblées | `PublishNotificationForm.tsx`, `PortfolioReviewNotificationDialog.tsx` |
| Managers (hiérarchie) | `ManagerAssignments.tsx`, `NewAssignmentForm.tsx`, `BulkRoleWizard.tsx` |
| Portefeuille (managers) | `AddPortfolioManagerForm.tsx` |
| Saisie d'activités tierces | `useWeeklyPointsData.ts` (sélecteur utilisateur) |
| Création nouvel user (existing) | RPC `get_users_without_profile` — à laisser tel quel |

Règle systématique : ajouter `.eq("is_active", true)` (ou filtrer côté client si la liste est déjà chargée globalement).

**Cas particuliers** :
- **Chef de projet d'un projet existant** affecté à un utilisateur devenu inactif : on conserve l'affichage du nom (lecture seule), mais la combobox de réaffectation ne le propose plus. Ajouter une indication "(inactif)" si rencontré.
- **Tâches déjà assignées** à un inactif : l'assignation reste, badge "(inactif)" dans `TaskCard`/`TaskTable`.
- **Managers d'un portefeuille** : idem, le manager reste listé mais marqué inactif.

**Livrable Phase 2 :** un utilisateur inactif n'apparaît plus dans aucun sélecteur, mais les données historiques restent cohérentes.

---

## Phase 3 — Effets de bord & accès

- **Login** : un utilisateur inactif peut techniquement encore se connecter (RLS inchangée). Décision à valider : 
  - Option A (recommandée) : le laisser se connecter mais afficher un écran "Compte désactivé" sur tout `ProtectedRoute` quand `profile.is_active === false`.
  - Option B : ne rien faire côté front, considérer l'admin Supabase pour bloquer l'auth si besoin.
- **PermissionsContext** : charger `is_active` avec le profil, exposer un flag `isAccountActive`. `ProtectedRoute` redirige vers `/login` + message si `false`.
- **Hooks de listes globales** (`useTeamManagement`, `useVisibleProjects` côté chef de projet) : ne pas filtrer les **projets** d'un utilisateur inactif (l'historique reste accessible aux autres), seulement son apparition dans les sélecteurs.

---

## Détails techniques

### Schéma
```sql
ALTER TABLE public.profiles
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE INDEX idx_profiles_active ON public.profiles (is_active) WHERE is_active = true;
```

### Pattern de filtrage côté requête
```ts
supabase.from("profiles")
  .select("id, first_name, last_name, email")
  .eq("is_active", true)
  .order("last_name");
```

### Pattern d'affichage historique
```tsx
{user && !user.is_active && <Badge variant="outline">Inactif</Badge>}
```

### Composant Switch dans la fiche
- Réutilise `@/components/ui/switch`.
- Label "Compte actif" + description courte ("Un utilisateur inactif n'apparaît plus dans les listes de sélection").
- Confirmation `AlertDialog` lors de la désactivation.

---

## Découpage de livraison recommandé
1. **PR 1 (Phase 1)** : migration + fiche admin + liste admin. Faible risque, déployable seul.
2. **PR 2 (Phase 2)** : filtrage propagé aux sélecteurs. Plus large mais purement additif.
3. **PR 3 (Phase 3)** : blocage d'accès des comptes inactifs + badges historiques.

## Points à confirmer avant implémentation
1. **Blocage de connexion** : doit-on empêcher un utilisateur inactif de se connecter (Phase 3 option A) ou seulement le retirer des listes ?
2. **Tâches/projets dont il est responsable** au moment de la désactivation : faut-il forcer une réaffectation ou simplement signaler ?
3. **Activités** : doit-on aussi cacher un utilisateur inactif des écrans de reporting (`TeamActivities`) ou seulement des saisies ?
