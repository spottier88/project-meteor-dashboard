

# Correctif — Rafraîchissement des risques après mutation

## Diagnostic

Le problème a **deux causes** :

1. **Mauvaise clé de cache invalidée** : Dans `RiskList.tsx`, après ajout/modification/suppression, on invalide `["risks", projectId]`. Or, dans `ProjectSummary.tsx` (ligne 305), les risques passés à `ProjectSummaryContent` sont `aggregatedRisks || risks || []`. Le hook `useAggregatedProjectData` est **toujours actif** (même pour les projets non-maîtres, car `allProjectIds` contient au minimum le projet courant). Sa query key est `["aggregatedRisks", allProjectIds]` — qui n'est **jamais invalidée** par `RiskList`.

2. **Query locale désactivée** : La query interne de `RiskList` a `enabled: false` quand `preloadedRisks` est fourni. Même si on invalidait la bonne clé parente, la query locale ne se relancerait pas.

En résumé : `aggregatedRisks` gagne toujours sur `risks`, et son cache n'est jamais invalidé après une mutation.

## Correction

### Fichier : `src/components/RiskList.tsx`

Ajouter l'invalidation de la clé `["aggregatedRisks"]` (invalidation partielle par préfixe) dans `handleFormSubmit` et `handleDelete`, en plus de `["risks", projectId]` :

```ts
// Dans handleFormSubmit et handleDelete :
queryClient.invalidateQueries({ queryKey: ["risks", projectId] });
queryClient.invalidateQueries({ queryKey: ["aggregatedRisks"] });
```

L'invalidation par préfixe `["aggregatedRisks"]` cible toutes les variantes de cette query, quel que soit le contenu de `allProjectIds`.

### Impact

| Fichier | Modification |
|---|---|
| `src/components/RiskList.tsx` | Ajout d'une invalidation `["aggregatedRisks"]` dans `handleFormSubmit` et `handleDelete` |

Aucune autre fonctionnalité impactée — on ajoute simplement une invalidation de cache supplémentaire.

