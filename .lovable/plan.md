
# Plan de correction : Rafraîchissement de la page après clôture de projet

## Problème identifié

Après la clôture d'un projet depuis la page `ProjectSummary`, le contenu de la page ne s'actualise pas :
- Le badge "Projet clôturé" n'apparaît pas
- Les boutons d'action restent visibles
- Le bouton "Réactiver" n'apparaît pas

### Cause racine

La query `projectAccess` dans `useProjectPermissions.tsx` :
- Utilise la clé `["projectAccess", projectId, userProfile?.id]`
- A un `staleTime` de 5 minutes empêchant le rafraîchissement automatique
- **N'est pas invalidée** par `useProjectClosure.ts` après la clôture

Le `lifecycle_status` est récupéré dans cette query et détermine `isProjectClosed`. Sans invalidation du cache, cette valeur reste à l'ancienne valeur même après la mise à jour en base de données.

---

## Solution proposée

Ajouter l'invalidation de la query `projectAccess` dans le hook `useProjectClosure.ts` après chaque opération de clôture réussie.

---

## Fichier à modifier

`src/hooks/useProjectClosure.ts`

### Modifications à effectuer

#### 1. Dans la fonction `postponeEvaluation` (ligne ~129-132)

Ajouter l'invalidation de `projectAccess` :

```typescript
// Invalider les caches
queryClient.invalidateQueries({ queryKey: ["project", projectId] });
queryClient.invalidateQueries({ queryKey: ["projects"] });
queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] }); // AJOUTER
```

#### 2. Dans la fonction `submitClosure` (ligne ~213-216)

Ajouter l'invalidation de `projectAccess` :

```typescript
// Invalider les caches
queryClient.invalidateQueries({ queryKey: ["project", projectId] });
queryClient.invalidateQueries({ queryKey: ["projects"] });
queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] }); // AJOUTER
```

#### 3. Dans la fonction `completeEvaluation` (ligne ~272-275)

Ajouter l'invalidation de `projectAccess` (même si ce cas ne change pas le `lifecycle_status`, c'est une bonne pratique pour la cohérence) :

```typescript
// Invalider les caches
queryClient.invalidateQueries({ queryKey: ["project", projectId] });
queryClient.invalidateQueries({ queryKey: ["projects"] });
queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] }); // AJOUTER
```

#### 4. Dans la fonction `deleteExistingClosureData` (ligne ~384-387)

Ajouter l'invalidation de `projectAccess` :

```typescript
// Invalider les caches
queryClient.invalidateQueries({ queryKey: ["project", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });
queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });
queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] }); // AJOUTER
```

---

## Résumé des changements

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjectClosure.ts` | Ajouter `queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] })` dans 4 fonctions |

---

## Comportement après correction

| Action | Avant correction | Après correction |
|--------|------------------|------------------|
| Clôture avec report | Badge invisible | Badge "Projet clôturé" visible |
| Clôture complète | Badge invisible | Badge "Projet clôturé" visible |
| Réactivation | - | Badge disparaît, actions réapparaissent |

---

## Pourquoi cette solution fonctionne

1. **Invalidation ciblée** : La clé `["projectAccess", projectId]` invalidera toutes les queries qui commencent par cette clé (y compris `["projectAccess", projectId, userProfile?.id]`)

2. **Rafraîchissement automatique** : React Query re-exécutera automatiquement la query `projectAccess` après invalidation

3. **Mise à jour de `isProjectClosed`** : La nouvelle valeur de `lifecycle_status` sera récupérée et `isProjectClosed` passera à `true`

4. **Propagation aux composants** : `ProjectSummaryContent` recevra les nouvelles permissions et affichera correctement le badge et masquera les actions

---

## Tests recommandés

1. **Clôturer un projet avec report d'évaluation** :
   - Vérifier que le badge "Projet clôturé" apparaît immédiatement
   - Vérifier que les boutons Modifier/Nouvelle revue disparaissent
   - Vérifier que le bouton "Réactiver" apparaît (pour admin/CDP)

2. **Clôturer un projet complètement** :
   - Mêmes vérifications que ci-dessus

3. **Réactiver un projet** :
   - Vérifier que le badge disparaît
   - Vérifier que les actions réapparaissent
