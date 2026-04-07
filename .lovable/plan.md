

# Correctif — La liste des risques ne se rafraîchit pas après ajout

## Diagnostic

Le problème est dans `RiskList.tsx`, ligne 58 :

```ts
enabled: !!projectId && !preloadedRisks,
```

Quand `preloadedRisks` est fourni (ce qui est le cas dans `ProjectSummaryContent.tsx`, ligne 304), la requête interne de `RiskList` est **désactivée**. Par conséquent, `refetch()` ne fonctionne pas — la query n'a jamais été activée.

Après un ajout/modification/suppression, `handleFormSubmit` appelle `refetch()`, mais comme la query est désactivée, rien ne se passe. Et `preloadedRisks` vient de la query `["risks", projectId]` définie dans `ProjectSummary.tsx`, qui n'est pas invalidée non plus.

## Correction

### Fichier unique : `src/components/RiskList.tsx`

Après chaque mutation (ajout, modification, suppression), invalider la query `["risks", projectId]` dans le cache React Query global, ce qui rafraîchira aussi bien la query locale que celle du parent (`ProjectSummary`).

```ts
import { useQueryClient } from "@tanstack/react-query";

// Dans le composant :
const queryClient = useQueryClient();

// Dans handleFormSubmit et handleDelete (après succès) :
queryClient.invalidateQueries({ queryKey: ["risks", projectId] });
```

Cela force le rechargement de la query quel que soit le composant qui la possède, y compris `ProjectSummary.tsx` qui fournit `preloadedRisks`.

### Impact

| Fichier | Modification |
|---|---|
| `src/components/RiskList.tsx` | Ajout `useQueryClient` + `invalidateQueries` dans `handleFormSubmit` et `handleDelete` |

Aucune autre fonctionnalité modifiée.

