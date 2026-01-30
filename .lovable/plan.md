
# Plan de correction : Erreur de contrainte unique lors de la re-clôture d'un projet

## Problème identifié

Lors de la clôture d'un projet pour la seconde fois (après une première clôture et une réactivation), l'erreur suivante se produit :

```
code: "23505"
message: "duplicate key value violates unique constraint \"project_evaluations_project_id_key\""
```

### Cause racine

La table `project_evaluations` a une contrainte d'unicité sur `project_id` (un seul enregistrement par projet). Le flux actuel présente deux problèmes :

1. **Réactivation incomplète** : Le bouton `ReactivateProjectButton` ne supprime **pas** les données d'évaluation et de revue finale existantes lors de la réactivation

2. **Insertion sans vérification** : La fonction `submitClosure` tente un `INSERT` sans vérifier/supprimer les données existantes au préalable

Le mécanisme de vérification dans `ClosureStepIntro` existe, mais il dépend d'une action manuelle de l'utilisateur et peut être contourné.

---

## Solution proposée

### Approche retenue : Nettoyage automatique avant insertion

Plutôt que de dépendre uniquement de la vérification dans l'UI, modifier les fonctions `submitClosure` et `postponeEvaluation` pour :

1. **Supprimer automatiquement** les évaluations et revues finales existantes **avant** d'insérer les nouvelles
2. Cela rend le processus **idempotent** et robuste

Cette approche est recommandée car elle garantit que la clôture fonctionnera toujours, même si le mécanisme de vérification UI est contourné.

---

## Fichier à modifier

`src/hooks/useProjectClosure.ts`

---

## Modifications à effectuer

### 1. Dans la fonction `postponeEvaluation` (ligne ~84-153)

Ajouter la suppression de la revue finale existante **avant** l'insertion :

```typescript
// Reporter l'évaluation (marque le projet comme terminé mais évaluation en attente)
const postponeEvaluation = async () => {
  if (!closureState.finalReviewData) {
    toast({
      title: "Erreur",
      description: "Le bilan du projet doit être complété avant de reporter l'évaluation.",
      variant: "destructive",
    });
    return false;
  }

  setClosureState(prev => ({ ...prev, isSubmitting: true }));

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // NOUVEAU : Supprimer les données de clôture existantes pour permettre une nouvelle clôture
    // Suppression de l'évaluation existante (si présente)
    await supabase
      .from("project_evaluations")
      .delete()
      .eq("project_id", projectId);

    // Suppression de la revue finale existante (si présente)
    await supabase
      .from("reviews")
      .delete()
      .eq("project_id", projectId)
      .eq("is_final_review", true);

    // 1. Créer la revue finale
    const { error: reviewError } = await supabase.from("reviews").insert({
      // ... reste inchangé
    });

    // ... reste de la fonction inchangé
  }
};
```

### 2. Dans la fonction `submitClosure` (ligne ~156-238)

Ajouter la suppression des données existantes **avant** l'insertion :

```typescript
// Soumettre la clôture complète
const submitClosure = async () => {
  if (!closureState.finalReviewData || !closureState.evaluationData) {
    toast({
      title: "Erreur",
      description: "Toutes les données doivent être complétées.",
      variant: "destructive",
    });
    return false;
  }

  setClosureState(prev => ({ ...prev, isSubmitting: true }));

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // NOUVEAU : Supprimer les données de clôture existantes pour permettre une nouvelle clôture
    // Cela garantit que l'insertion ne violera pas la contrainte d'unicité
    
    // Suppression de l'évaluation existante (si présente)
    await supabase
      .from("project_evaluations")
      .delete()
      .eq("project_id", projectId);

    // Suppression de la revue finale existante (si présente)
    await supabase
      .from("reviews")
      .delete()
      .eq("project_id", projectId)
      .eq("is_final_review", true);

    // 1. Créer la revue finale
    const { error: reviewError } = await supabase.from("reviews").insert({
      // ... reste inchangé
    });

    // 2. Créer l'évaluation de méthode
    const { error: evalError } = await supabase.from("project_evaluations").insert({
      // ... reste inchangé
    });

    // ... reste de la fonction inchangé
  }
};
```

---

## Résumé des modifications

| Fichier | Fonction | Modification |
|---------|----------|--------------|
| `src/hooks/useProjectClosure.ts` | `postponeEvaluation` | Ajouter suppression des données existantes avant insertion |
| `src/hooks/useProjectClosure.ts` | `submitClosure` | Ajouter suppression des données existantes avant insertion |

---

## Logique de nettoyage ajoutée

```typescript
// Suppression de l'évaluation existante (si présente)
await supabase
  .from("project_evaluations")
  .delete()
  .eq("project_id", projectId);

// Suppression de la revue finale existante (si présente)  
await supabase
  .from("reviews")
  .delete()
  .eq("project_id", projectId)
  .eq("is_final_review", true);
```

**Notes :**
- Ces suppressions utilisent `.eq()` donc si aucun enregistrement n'existe, la requête ne fait rien (pas d'erreur)
- Les erreurs de suppression ne sont pas vérifiées car elles ne doivent pas bloquer le processus
- Cette approche est recommandée par la documentation (Stack Overflow) pour ce type de contrainte

---

## Flux après correction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Re-clôture d'un projet                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ submitClosure / postpone...   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 1. DELETE project_evaluations │  ← NOUVEAU
              │    WHERE project_id = ?       │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 2. DELETE reviews             │  ← NOUVEAU
              │    WHERE is_final_review      │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 3. INSERT reviews             │  ✅ Pas de conflit
              │    (nouvelle revue finale)    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 4. INSERT project_evaluations │  ✅ Pas de conflit
              │    (nouvelle évaluation)      │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 5. UPDATE project             │
              │    (statut clôturé)           │
              └───────────────────────────────┘
```

---

## Avantages de cette solution

1. **Robuste** : Fonctionne même si l'utilisateur contourne la vérification UI
2. **Idempotent** : Peut être exécuté plusieurs fois sans erreur
3. **Pas de dépendance** : Ne dépend pas de l'état `existingData` qui pourrait être obsolète
4. **Simple** : Quelques lignes de code ajoutées sans restructuration majeure
5. **Cohérent** : Les nouvelles données remplacent toujours les anciennes

---

## Impact sur le mécanisme existant

Le mécanisme de vérification dans `ClosureStepIntro` reste utile comme **garde-fou visuel** pour informer l'utilisateur, mais n'est plus critique pour le fonctionnement. La suppression automatique garantit le succès de l'opération.
