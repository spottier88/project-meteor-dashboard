
# Plan de correction : Fonctionnalité de complétion d'évaluation reportée

## Problème identifié

Lorsqu'un utilisateur tente de compléter une évaluation reportée, l'erreur `duplicate key value violates unique constraint "project_evaluations_project_id_key"` se produit.

### Cause racine

La fonction `completeEvaluation` dans `useProjectClosure.ts` effectue toujours un `INSERT` dans la table `project_evaluations`. Si une évaluation existe déjà (par exemple suite à une tentative précédente ou une erreur réseau ayant quand même inséré les données), l'insertion échoue car la contrainte d'unicité sur `project_id` est violée.

### Scénarios de reproduction

1. L'utilisateur clôture un projet avec report de l'évaluation
2. Plus tard, il tente de compléter l'évaluation
3. Si une tentative précédente a partiellement réussi ou si les données existent déjà pour une autre raison, l'INSERT échoue

---

## Solution proposée

Modifier la fonction `completeEvaluation` pour utiliser un `UPSERT` au lieu d'un `INSERT`, permettant ainsi de mettre à jour l'évaluation si elle existe déjà ou de la créer si elle n'existe pas.

---

## Fichier à modifier

`src/hooks/useProjectClosure.ts`

### Modification de la fonction `completeEvaluation`

Remplacer l'appel `INSERT` par un `UPSERT` en utilisant la clause `onConflict` de Supabase.

#### Avant (lignes 246-256)

```typescript
// Créer l'évaluation de méthode
const { error: evalError } = await supabase.from("project_evaluations").insert({
  project_id: projectId,
  what_worked: evaluationData.what_worked,
  what_was_missing: evaluationData.what_was_missing,
  improvements: evaluationData.improvements,
  lessons_learned: evaluationData.lessons_learned,
  created_by: userId,
});

if (evalError) throw evalError;
```

#### Après

```typescript
// Créer ou mettre à jour l'évaluation de méthode (upsert)
// Utilise onConflict pour gérer le cas où une évaluation existe déjà
const { error: evalError } = await supabase
  .from("project_evaluations")
  .upsert({
    project_id: projectId,
    what_worked: evaluationData.what_worked,
    what_was_missing: evaluationData.what_was_missing,
    improvements: evaluationData.improvements,
    lessons_learned: evaluationData.lessons_learned,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'project_id',
    ignoreDuplicates: false,
  });

if (evalError) throw evalError;
```

---

## Explication technique

### Pourquoi `upsert` plutôt que vérifier puis insérer ?

1. **Atomicité** : L'upsert est une opération atomique, évitant les conditions de concurrence (race conditions)
2. **Simplicité** : Une seule requête au lieu de deux (SELECT puis INSERT/UPDATE)
3. **Robustesse** : Gère automatiquement les deux cas (création et mise à jour)

### Comportement de l'upsert

- Si aucune évaluation n'existe pour ce `project_id` : création d'un nouvel enregistrement
- Si une évaluation existe déjà : mise à jour des champs avec les nouvelles valeurs

---

## Impact

| Scénario | Comportement actuel | Comportement après correction |
|----------|---------------------|-------------------------------|
| Première complétion | OK | OK |
| Complétion après échec réseau | Erreur 23505 | Mise à jour réussie |
| Double clic rapide | Erreur potentielle | Mise à jour idempotente |
| Réouverture après tentative échouée | Erreur 23505 | Mise à jour réussie |

---

## Tests recommandés

1. **Scénario nominal** : Reporter une évaluation puis la compléter → succès
2. **Scénario de reprise** : Reporter, tenter de compléter (simuler échec), retenter → succès
3. **Scénario existant** : S'assurer que la clôture complète (sans report) fonctionne toujours
4. **Vérification des données** : Confirmer que les champs sont correctement mis à jour

---

## Résumé des changements

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjectClosure.ts` | Remplacer `.insert()` par `.upsert()` avec `onConflict: 'project_id'` dans `completeEvaluation` |

Cette correction garantit que la fonctionnalité de complétion d'évaluation reportée fonctionne de manière robuste, même en cas de tentatives multiples ou d'erreurs réseau partielles.
