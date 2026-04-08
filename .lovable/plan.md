

# Correctif — Rafraîchissement du bloc dernière revue après suppression

## Diagnostic

La clé de cache ne correspond pas :

- `DeleteReviewDialog.tsx` invalide `["lastReview", projectId]` (singulier)
- `ProjectSummary.tsx` utilise `["lastReviews", projectId]` (pluriel)

La query qui alimente le bloc "dernière revue" dans ProjectSummary n'est donc **jamais invalidée** lors d'une suppression.

## Correction

### Fichier : `src/components/review/DeleteReviewDialog.tsx`

Ajouter l'invalidation de la clé `["lastReviews", projectId]` dans le bloc de succès de `handleDelete`, à côté des invalidations existantes :

```ts
await queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });
```

Aucune autre modification nécessaire. Le `refetchLastReview` callback dans `ProjectSummary` sera aussi déclenché automatiquement par l'invalidation du cache.

### Impact

| Fichier | Modification |
|---|---|
| `src/components/review/DeleteReviewDialog.tsx` | Ajout d'une invalidation `["lastReviews", projectId]` |

Aucune autre fonctionnalité impactée.

