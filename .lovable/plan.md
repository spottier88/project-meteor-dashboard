
# Plan de correction : Badge "clôturé" non affiché au premier chargement

## Problème identifié

Lors de l'accès à la page de résumé d'un projet clôturé, le badge "Projet clôturé" et les restrictions associées ne sont pas appliqués immédiatement au premier rendu.

### Cause racine

La variable `isProjectClosed` dépend de `projectAccess?.lifecycleStatus` qui est chargé de manière **asynchrone** via `useQuery`. 

1. **Au premier rendu** : `projectAccess` est `undefined` (query en cours)
2. **Conséquence** : `projectAccess?.lifecycleStatus` retourne `undefined`
3. **Résultat** : `isProjectClosed = undefined === 'completed'` → `false`
4. **Effet** : Le badge n'est pas affiché et les boutons restent actifs

De plus, la valeur par défaut retournée par la query ne contient **pas** les champs `lifecycleStatus` et `closureStatus` :

```typescript
// Valeur de retour par défaut (lignes 19-25)
return {
  canEdit: false,
  isProjectManager: false,
  // ... autres propriétés
  // ⚠️ lifecycleStatus et closureStatus ABSENTS !
};
```

---

## Solution proposée

### Approche retenue : Valeurs par défaut complètes + État de chargement

1. **Ajouter les champs manquants** dans les valeurs par défaut de la query
2. **Exposer un état `isLoading`** pour permettre aux composants de savoir quand les données sont prêtes
3. **Utiliser le projet déjà chargé** dans `ProjectSummary` pour initialiser `isProjectClosed` en attendant

---

## Fichier à modifier

`src/hooks/useProjectPermissions.tsx`

---

## Modifications détaillées

### 1. Ajouter les champs manquants dans la valeur par défaut (lignes 19-25)

Ajouter `lifecycleStatus` et `closureStatus` avec des valeurs par défaut `undefined` :

```typescript
if (!userProfile?.id || !projectId) return {
  canEdit: false,
  isProjectManager: false,
  isSecondaryProjectManager: false,
  isMember: false,
  hasRegularAccess: false,
  lifecycleStatus: undefined,    // ← NOUVEAU
  closureStatus: undefined,      // ← NOUVEAU
  projectOrganization: undefined // ← NOUVEAU (pour cohérence)
};
```

### 2. Exposer l'état de chargement de la query

Récupérer `isLoading` de la query et l'exposer :

```typescript
const { data: projectAccess, isLoading: isLoadingProjectAccess } = useQuery({
  queryKey: ["projectAccess", projectId, userProfile?.id],
  // ...
});
```

### 3. Retourner l'état de chargement dans le hook

Ajouter `isLoadingProjectAccess` dans les valeurs retournées :

```typescript
return {
  // ... propriétés existantes
  isLoadingProjectAccess,  // ← NOUVEAU
};
```

### 4. Mettre à jour `ProjectSummaryContent.tsx`

Ajouter une gestion de l'état de chargement dans l'interface des permissions :

```typescript
permissions: {
  // ... propriétés existantes
  isLoadingProjectAccess?: boolean;
};
```

Optionnellement, afficher un indicateur de chargement ou utiliser les données du projet directement.

---

## Alternative recommandée : Utiliser les données du projet déjà chargé

Une approche plus robuste consiste à **passer le `lifecycle_status` du projet directement** depuis `ProjectSummary.tsx`, car le projet est déjà chargé via une query séparée.

### Dans `ProjectSummary.tsx` :

Le projet est déjà chargé avec `lifecycle_status` (ligne 47-83). On peut enrichir les permissions :

```typescript
// Dans ProjectSummary.tsx, après avoir chargé le projet
const enhancedPermissions = {
  ...projectPermissions,
  // Si les permissions ne sont pas encore chargées, utiliser les données du projet
  isProjectClosed: projectPermissions.isProjectClosed ?? (project?.lifecycle_status === 'completed'),
  hasPendingEvaluation: projectPermissions.hasPendingEvaluation ?? 
    (project?.lifecycle_status === 'completed' && project?.closure_status === 'pending_evaluation'),
  canReactivateProject: projectPermissions.canReactivateProject ?? 
    ((project?.lifecycle_status === 'completed') && (projectPermissions.isAdmin || projectPermissions.isProjectManager)),
  canCompleteEvaluation: projectPermissions.canCompleteEvaluation ?? 
    ((project?.lifecycle_status === 'completed' && project?.closure_status === 'pending_evaluation') && 
     (projectPermissions.isAdmin || projectPermissions.isProjectManager))
};

// Puis passer enhancedPermissions au lieu de projectPermissions
<ProjectSummaryContent
  project={project}
  // ...
  permissions={enhancedPermissions}
/>
```

---

## Résumé des modifications

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjectPermissions.tsx` | Ajouter `lifecycleStatus`, `closureStatus` dans valeurs par défaut + exposer `isLoadingProjectAccess` |
| `src/pages/ProjectSummary.tsx` | Enrichir les permissions avec les données du projet déjà chargé |

---

## Solution finale retenue

La solution la plus simple et la plus robuste combine les deux approches :

### 1. Dans `useProjectPermissions.tsx`

- Ajouter `lifecycleStatus: undefined` et `closureStatus: undefined` dans les valeurs par défaut
- Exposer `isLoadingProjectAccess` pour permettre aux composants de gérer l'état de chargement

### 2. Dans `ProjectSummary.tsx`

- Utiliser les données du projet (déjà chargé) comme **fallback** pour les permissions liées à la clôture
- Cela garantit que dès que le projet est affiché, le statut de clôture est correct

---

## Flux après correction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Premier rendu                                │
└─────────────────────────────────────────────────────────────────┘
                              │
     useQuery (project) terminé : project.lifecycle_status = 'completed'
                              │
                              ▼
     useQuery (projectAccess) en cours...
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  AVANT : isProjectClosed = undefined → false           │
     │  APRÈS : isProjectClosed = project?.lifecycle_status   │
     │          → 'completed' = true ✓                        │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     Badge "Projet clôturé" affiché dès le premier rendu ✓
```

---

## Avantages

1. **Immédiat** : Le badge s'affiche dès que le projet est chargé
2. **Robuste** : Double source de données (projet + permissions)
3. **Cohérent** : Les permissions sont correctes même si la query `projectAccess` échoue
4. **Minimal** : Modifications légères dans seulement 2 fichiers
