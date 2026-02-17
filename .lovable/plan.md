

# Vue globale des droits utilisateurs - Revue des permissions

## Objectif

Ajouter une fonctionnalite de revue des droits dans la gestion des utilisateurs, permettant de visualiser pour chaque utilisateur ses roles et, pour les managers, leurs affectations hierarchiques. L'objectif est de faciliter les revues de droits periodiques par les administrateurs.

## Approche retenue

Ajouter un **nouvel onglet "Revue des droits"** dans la page de gestion des utilisateurs existante (`/admin/users`), accessible via un systeme d'onglets (Tabs). L'onglet actuel devient "Liste des utilisateurs", et le nouvel onglet affiche une vue consolidee avec export Excel.

## Fonctionnalites

### Vue consolidee (tableau)

Un tableau affichant pour chaque utilisateur :
- Nom / Prenom / Email
- Liste des roles (badges)
- Pour les managers : les chemins hierarchiques assignes (depuis `manager_path_assignments` + `hierarchy_paths`)
- Derniere activite

### Filtres

- Filtre par role (dropdown multi-selection)
- Filtre "Managers sans affectation" (checkbox)
- Recherche textuelle (nom, prenom, email)

### Export Excel

Un bouton d'export generant un fichier `.xlsx` avec :
- **Onglet 1 - Synthese** : une ligne par utilisateur avec colonnes Nom, Prenom, Email, Roles, Affectations hierarchiques, Derniere activite
- **Onglet 2 - Detail managers** : une ligne par affectation hierarchique (utilisateur + chemin)

---

## Details techniques

### Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/components/admin/PermissionsReviewTab.tsx` | Composant principal de l'onglet revue des droits |
| `src/components/admin/PermissionsReviewTable.tsx` | Tableau consolide des droits |
| `src/components/admin/PermissionsReviewFilters.tsx` | Filtres (role, recherche, managers sans affectation) |
| `src/utils/permissionsExport.ts` | Logique d'export Excel des droits |

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/UserManagement.tsx` | Encapsuler le contenu actuel dans un systeme `Tabs` avec deux onglets |

### Requete de donnees

Le composant `PermissionsReviewTab` effectuera une seule requete consolidee :

```typescript
// 1. Profils + roles (existant, reutilise)
const profiles = await supabase.from("profiles").select("*");
const roles = await supabase.from("user_roles").select("*");

// 2. Toutes les affectations managers avec chemins
const assignments = await supabase
  .from("manager_path_assignments")
  .select("user_id, path_id, hierarchy_paths(path_string)");
```

Les donnees sont ensuite consolidees cote client pour construire la vue.

### Structure du tableau

```text
+----------+---------+------------------+----------------------------+-------------------+
| Nom      | Prenom  | Email            | Roles                      | Affectations      |
+----------+---------+------------------+----------------------------+-------------------+
| Dupont   | Jean    | j.dupont@...     | Admin, Manager             | IT > Dev > Front  |
|          |         |                  |                            | IT > Dev > Back   |
+----------+---------+------------------+----------------------------+-------------------+
| Martin   | Marie   | m.martin@...     | Chef de projet             | -                 |
+----------+---------+------------------+----------------------------+-------------------+
| Durand   | Pierre  | p.durand@...     | Manager [!Non affecte]     | (aucune)          |
+----------+---------+------------------+----------------------------+-------------------+
```

### Export Excel

Le fichier `permissionsExport.ts` utilisera la bibliotheque `xlsx` (deja installee) pour generer deux onglets :

- **Onglet "Synthese des droits"** : une ligne par utilisateur, colonne "Affectations" contenant les chemins separes par des retours a la ligne
- **Onglet "Detail affectations managers"** : une ligne par couple (utilisateur, chemin hierarchique)

### Integration dans UserManagement.tsx

La page actuelle sera reorganisee avec des `Tabs` :

```text
[Liste des utilisateurs] [Revue des droits]
```

- L'onglet "Liste des utilisateurs" contient le tableau et les actions existants (inchange)
- L'onglet "Revue des droits" affiche le nouveau composant `PermissionsReviewTab`

---

## Sequencement

1. Creer `PermissionsReviewFilters.tsx` (filtres par role, recherche, checkbox managers)
2. Creer `PermissionsReviewTable.tsx` (tableau consolide)
3. Creer `permissionsExport.ts` (export Excel)
4. Creer `PermissionsReviewTab.tsx` (assemblage filtres + tableau + bouton export)
5. Modifier `UserManagement.tsx` (ajout des Tabs)

