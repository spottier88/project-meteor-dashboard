

# Plan de correction : Erreur 23505 lors de la re-clôture d'un projet

## Problème identifié

Lors de la re-clôture d'un projet (après réactivation), l'erreur suivante se produit :

```
code: "23505"
message: "duplicate key value violates unique constraint \"project_evaluations_project_id_key\""
```

### Cause racine

**Il n'existe PAS de policy RLS DELETE sur la table `project_evaluations`.**

Les policies actuelles sur `project_evaluations` sont :
- `SELECT` : Users can view project evaluations ✓
- `INSERT` : Users can create project evaluations ✓
- `UPDATE` : Users can update project evaluations ✓
- **`DELETE` : ABSENTE** ✗

Conséquence : les suppressions dans `submitClosure()` et `postponeEvaluation()` (lignes 189-193 et 101-105) s'exécutent **sans erreur** mais **ne suppriment aucune ligne** car RLS bloque silencieusement l'opération DELETE.

---

## Solution proposée

### 1. Ajouter une policy DELETE sur `project_evaluations`

Créer une migration SQL pour ajouter la policy manquante avec les mêmes permissions que UPDATE.

**Fichier à créer :** `supabase/migrations/XXXXXXXX_add_delete_policy_project_evaluations.sql`

```sql
-- Ajouter la policy DELETE manquante sur project_evaluations
-- Permet aux propriétaires du projet et aux admins de supprimer les évaluations

CREATE POLICY "Users can delete project evaluations"
ON project_evaluations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM profiles pr
        WHERE pr.id = auth.uid()
        AND p.project_manager = pr.email
      )
    )
  )
);
```

**Logique de la policy :**
- Le propriétaire du projet (`owner_id`) peut supprimer
- Les administrateurs peuvent supprimer
- Le chef de projet (`project_manager`) peut supprimer

### 2. Ajouter la suppression des évaluations dans `ReactivateProjectButton`

Pour plus de robustesse, supprimer les données de clôture lors de la réactivation du projet.

**Fichier à modifier :** `src/components/project/ReactivateProjectButton.tsx`

```typescript
const handleReactivate = async () => {
  setIsReactivating(true);
  try {
    // NOUVEAU : Supprimer les données de clôture existantes avant réactivation
    // Suppression de l'évaluation de méthode
    await supabase
      .from("project_evaluations")
      .delete()
      .eq("project_id", projectId);

    // Suppression de la revue finale
    await supabase
      .from("reviews")
      .delete()
      .eq("project_id", projectId)
      .eq("is_final_review", true);

    // Mise à jour du projet (existant)
    const { error } = await supabase
      .from("projects")
      .update({ 
        lifecycle_status: "in_progress",
        closure_status: null,
        closed_at: null,
        closed_by: null
      })
      .eq("id", projectId);

    if (error) throw error;

    // ... reste du code inchangé
  }
};
```

---

## Résumé des modifications

| Type | Fichier | Description |
|------|---------|-------------|
| **Migration SQL** | `supabase/migrations/..._add_delete_policy_project_evaluations.sql` | Ajouter policy DELETE sur `project_evaluations` |
| **Code** | `src/components/project/ReactivateProjectButton.tsx` | Supprimer évaluations et revues finales lors de la réactivation |

---

## Pourquoi cette solution fonctionne

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Avant (problème)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
     submitClosure() appelle DELETE project_evaluations
                              │
                              ▼
              ┌───────────────────────────────┐
              │ RLS vérifie la policy DELETE  │
              │ → Policy inexistante = BLOQUÉ │
              │ → 0 lignes supprimées         │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ INSERT project_evaluations    │
              │ → Violation contrainte unique │
              │ → Erreur 23505                │
              └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Après (solution)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
     submitClosure() appelle DELETE project_evaluations
                              │
                              ▼
              ┌───────────────────────────────┐
              │ RLS vérifie la policy DELETE  │
              │ → Policy existe = AUTORISÉ    │
              │ → 1 ligne supprimée           │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ INSERT project_evaluations    │
              │ → Table vide, OK              │
              │ → Succès                      │
              └───────────────────────────────┘
```

---

## Détails techniques

### Policy DELETE ajoutée

La policy autorise la suppression si :
1. L'utilisateur est le **propriétaire du projet** (`owner_id = auth.uid()`)
2. L'utilisateur est **administrateur** (rôle `admin` dans `user_roles`)
3. L'utilisateur est le **chef de projet** (`project_manager = email du profil`)

Ces conditions sont cohérentes avec les policies UPDATE existantes.

### Double sécurité avec ReactivateProjectButton

Bien que la policy DELETE résolve le problème principal, ajouter la suppression dans `ReactivateProjectButton` offre une **double sécurité** :
- Nettoie les données dès la réactivation
- Évite les états incohérents (projet "en cours" avec des données de clôture)

---

## Tests recommandés

1. **Tester la re-clôture complète**
   - Clôturer un projet avec évaluation complète
   - Réactiver le projet
   - Re-clôturer avec une nouvelle évaluation
   - Vérifier : pas d'erreur 23505

2. **Tester la re-clôture après report**
   - Clôturer un projet avec report d'évaluation
   - Réactiver le projet
   - Re-clôturer (avec ou sans évaluation)
   - Vérifier : pas d'erreur 23505

3. **Tester les permissions**
   - En tant que chef de projet : vérifier suppression OK
   - En tant qu'admin : vérifier suppression OK
   - En tant que membre simple : vérifier suppression bloquée

