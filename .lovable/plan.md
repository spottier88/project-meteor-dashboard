
# Plan de correction : Affichage immédiat du bouton "Réactiver le projet"

## Problème identifié

Le bouton "Réactiver le projet" n'apparaît pas immédiatement lorsqu'on accède à un projet clôturé depuis la liste, car :

1. **`canReactivateProject` retourne `false` au lieu de `undefined`** : Dans `useProjectPermissions`, le calcul retourne `false` pendant le chargement car `isProjectClosed` est `false` (données non encore chargées)

2. **L'opérateur `??` ne fonctionne pas** : Dans `ProjectSummary.tsx`, le code utilise :
   ```typescript
   canReactivateProject: projectPermissions.canReactivateProject ?? fallback
   ```
   Or, `false ?? fallback` retourne `false`, pas le fallback

3. **Chaîne de dépendances asynchrones** :
   - `projectAccess` → requête async → `undefined` au 1er rendu
   - `isProjectClosed` = `projectAccess?.lifecycleStatus === 'completed'` → `false`
   - `canReactivateProject` = `isProjectClosed && ...` → `false`

## Solution proposée

### Approche : Forcer le calcul synchrone à partir des données du projet

Utiliser exclusivement les données du projet (`project.lifecycle_status`) et du profil utilisateur (`userProfile.email`) déjà disponibles pour calculer les permissions de réactivation, sans dépendre du hook asynchrone.

---

## Modifications à effectuer

### 1. Modifier `ProjectSummary.tsx`

#### a) Calculer `canReactivateProject` de manière synchrone

Au lieu d'utiliser `projectPermissions.canReactivateProject` avec un fallback `??`, calculer directement depuis les données du projet :

```typescript
// Calcul 100% synchrone - ne dépend pas de projectPermissions
const syncIsProjectClosed = project?.lifecycle_status === 'completed';
const syncHasPendingEvaluation = syncIsProjectClosed && project?.closure_status === 'pending_evaluation';
const isCurrentUserProjectManager = project?.project_manager === userProfile?.email;

// Calcul synchrone de canReactivateProject
// Utiliser isAdmin du contexte (déjà chargé) et le calcul synchrone du chef de projet
const syncCanReactivateProject = syncIsProjectClosed && 
  (projectPermissions.isAdmin || isCurrentUserProjectManager);

const syncCanCompleteEvaluation = syncHasPendingEvaluation && 
  (projectPermissions.isAdmin || isCurrentUserProjectManager);
```

#### b) Utiliser ces valeurs synchrones dans les permissions

```typescript
permissions={{
  ...projectPermissions,
  // Forcer les valeurs synchrones (pas de fallback avec ??)
  isProjectManager: isCurrentUserProjectManager || projectPermissions.isProjectManager,
  isProjectClosed: syncIsProjectClosed,
  hasPendingEvaluation: syncHasPendingEvaluation,
  canReactivateProject: syncCanReactivateProject,
  canCompleteEvaluation: syncCanCompleteEvaluation,
}}
```

---

### 2. Améliorer `useProjectPermissions.tsx` (optionnel, pour robustesse)

#### a) Retourner `undefined` au lieu de `false` pendant le chargement

Modifier le hook pour distinguer "pas autorisé" de "en cours de chargement" :

```typescript
// Au lieu de :
const isProjectClosed = projectAccess?.lifecycleStatus === 'completed';
const canReactivateProject = isProjectClosed && (isAdmin || projectAccess?.isProjectManager);

// Utiliser :
const isProjectClosed = projectAccess ? projectAccess.lifecycleStatus === 'completed' : undefined;
const canReactivateProject = isProjectClosed === undefined ? undefined : 
  (isProjectClosed && (isAdmin || projectAccess?.isProjectManager));
```

Cela permettra au `??` de fonctionner correctement dans les composants parents.

---

## Résumé des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/ProjectSummary.tsx` | Calculer `canReactivateProject` et `canCompleteEvaluation` de manière 100% synchrone |
| `src/hooks/useProjectPermissions.tsx` | (Optionnel) Retourner `undefined` pendant le chargement pour permettre le fallback |

---

## Flux après correction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Premier rendu                                │
└─────────────────────────────────────────────────────────────────┘
                              │
     project chargé : lifecycle_status = 'completed'
     userProfile chargé : email = 'user@example.com'
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectSummary.tsx - Calcul SYNCHRONE                 │
     │                                                         │
     │  syncIsProjectClosed = project.lifecycle_status === 'completed'    │
     │                      = true ✓                          │
     │                                                         │
     │  isCurrentUserProjectManager = project.project_manager === userProfile.email │
     │                              = true (si CDP) ✓         │
     │                                                         │
     │  syncCanReactivateProject = syncIsProjectClosed &&     │
     │                            (isAdmin || isCurrentUserProjectManager) │
     │                          = true ✓                      │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectSummaryContent reçoit :                        │
     │  - permissions.canReactivateProject = true ✓           │
     │                                                         │
     │  Le bouton "Réactiver le projet" s'affiche             │
     │  IMMÉDIATEMENT au premier rendu ✓                      │
     └────────────────────────────────────────────────────────┘
```

---

## Détails techniques

### Pourquoi cette approche fonctionne

1. **`project`** est chargé via `useQuery` avec la clé `["project", projectId]` - c'est la même requête utilisée partout, donc les données sont souvent déjà en cache

2. **`userProfile`** vient du `PermissionsContext` qui est chargé au niveau racine de l'application - il est donc toujours disponible

3. **`isAdmin`** vient aussi du contexte (`effectiveAdminStatus`) - toujours disponible

4. En combinant ces trois sources synchrones, on peut calculer `canReactivateProject` sans attendre `projectAccess`

### Code final dans ProjectSummary.tsx

```typescript
// Récupérer le profil utilisateur depuis le contexte (synchrone)
const { userProfile } = usePermissionsContext();

// ... après le chargement du project ...

// Calculs 100% synchrones
const syncIsProjectClosed = project?.lifecycle_status === 'completed';
const syncHasPendingEvaluation = syncIsProjectClosed && project?.closure_status === 'pending_evaluation';
const isCurrentUserProjectManager = project?.project_manager === userProfile?.email;

// Ces permissions sont calculées de manière synchrone et ne dépendent pas de projectAccess
const syncCanReactivateProject = syncIsProjectClosed && 
  (projectPermissions.isAdmin || isCurrentUserProjectManager);

const syncCanCompleteEvaluation = syncHasPendingEvaluation && 
  (projectPermissions.isAdmin || isCurrentUserProjectManager);

return (
  <ProjectSummaryContent
    permissions={{
      ...projectPermissions,
      isProjectClosed: syncIsProjectClosed,
      hasPendingEvaluation: syncHasPendingEvaluation,
      isProjectManager: isCurrentUserProjectManager || projectPermissions.isProjectManager,
      canReactivateProject: syncCanReactivateProject,
      canCompleteEvaluation: syncCanCompleteEvaluation,
    }}
  />
);
```

---

## Avantages de cette solution

1. **100% synchrone** : Aucune attente de requête asynchrone
2. **Sources fiables** : Utilise `project` (déjà chargé) et `userProfile` (toujours disponible)
3. **Simple** : Pas de modification complexe des hooks
4. **Cohérent** : Le même pattern utilisé pour `isProjectClosed` et les autres badges

---

## Tests recommandés

1. **Navigation depuis la liste des projets**
   - Charger la liste des projets
   - Cliquer sur un projet clôturé
   - Vérifier que le bouton "Réactiver" apparaît IMMÉDIATEMENT

2. **Accès direct via URL**
   - Naviguer directement vers `/projects/{id}` d'un projet clôturé
   - Vérifier que le bouton "Réactiver" apparaît dès le premier rendu

3. **Évaluation en attente**
   - Naviguer vers un projet avec `closure_status = 'pending_evaluation'`
   - Vérifier que le bouton "Compléter l'évaluation" apparaît immédiatement

4. **Utilisateur non autorisé**
   - Se connecter avec un utilisateur non admin et non chef de projet
   - Naviguer vers un projet clôturé
   - Vérifier que le bouton "Réactiver" n'apparaît PAS
