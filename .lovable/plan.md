
# Plan de correction complet : Gestion du mode lecture seule pour projets clôturés

## Problème identifié

Le statut de clôture du projet (`isProjectClosed`) n'est pas correctement propagé au premier rendu car :

1. **Hooks multiples asynchrones** : `TaskList`, `RiskList`, `TeamManagement` utilisent des hooks indépendants (`useTaskPermissions`, `useRiskAccess`) qui effectuent leurs propres requêtes asynchrones
2. **Pas de transmission directe** : Ces composants ne reçoivent pas `isProjectClosed` en prop - ils calculent cette valeur eux-mêmes
3. **Fallback incomplet** : Les permissions enrichies dans `ProjectSummary` ne sont pas utilisées par les sous-composants

## Solution proposée

### Approche : Transmission explicite de `isProjectClosed`

Modifier l'architecture pour passer explicitement l'état `isProjectClosed` aux composants enfants, en utilisant les données du projet déjà chargées comme source de vérité synchrone.

---

## Modifications à effectuer

### 1. Modifier `ProjectSummaryContent.tsx`

#### a) Ajouter `isProjectClosed` dans l'interface permissions (si pas déjà fait)

L'interface existe déjà avec `isProjectClosed?: boolean;` - c'est correct.

#### b) Calculer les permissions effectives localement

Utiliser `isProjectClosed` transmis par le parent pour désactiver les actions dans les onglets :

```typescript
// Calculer les permissions effectives en tenant compte du projet clôturé
const effectiveCanEdit = permissions.isProjectClosed ? false : permissions.canEdit;
const effectiveCanManageTeam = permissions.isProjectClosed ? false : permissions.canManageTeam;
const effectiveCanManageRisks = permissions.isProjectClosed ? false : permissions.canManageRisks;
```

#### c) Transmettre ces valeurs aux composants enfants

```tsx
<TaskList 
  projectId={projectId}
  canEdit={effectiveCanEdit}      // Au lieu de permissions.canEdit
  isProjectManager={permissions.isProjectManager}
  isAdmin={permissions.isAdmin}
  isProjectClosed={permissions.isProjectClosed}  // NOUVEAU
  preloadedTasks={tasks}
/>

<RiskList 
  projectId={projectId}
  projectTitle={project.title}
  canEdit={effectiveCanEdit}
  isProjectManager={permissions.isProjectManager}
  isAdmin={permissions.isAdmin}
  isProjectClosed={permissions.isProjectClosed}  // NOUVEAU
  preloadedRisks={risks}
/>

<ProjectNotesList
  projectId={projectId}
  canEdit={effectiveCanEdit}
  isAdmin={permissions.isAdmin}
  isProjectClosed={permissions.isProjectClosed}  // NOUVEAU
/>

<TeamManagement
  projectId={projectId}
  permissions={{
    ...permissions,
    canEdit: effectiveCanEdit,           // Permissions effectives
    canManageTeam: effectiveCanManageTeam,
  }}
  preloadedData={teamManagement}
/>
```

---

### 2. Modifier `TaskList.tsx`

#### a) Ajouter la prop `isProjectClosed`

```typescript
export interface TaskListProps {
  projectId: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
  isProjectClosed?: boolean;  // NOUVEAU
  preloadedTasks?: any[];
}
```

#### b) Utiliser cette prop pour forcer le mode lecture seule

```typescript
const { canCreateTask: hookCanCreate, canEditTask: hookCanEdit, canDeleteTask: hookCanDelete } = useTaskPermissions(projectId);

// Si le projet est clôturé (prop transmise), forcer les permissions en lecture seule
const canCreateTask = isProjectClosed ? false : hookCanCreate;
const canEditTask = (assignee?: string) => isProjectClosed ? false : hookCanEdit(assignee);
const canDeleteTask = isProjectClosed ? false : hookCanDelete;
```

---

### 3. Modifier `RiskList.tsx`

#### a) Ajouter la prop `isProjectClosed`

```typescript
export interface RiskListProps {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
  isProjectClosed?: boolean;  // NOUVEAU
  onUpdate?: () => void;
  preloadedRisks?: any[];
}
```

#### b) Utiliser cette prop dans le composant

```typescript
const { canCreateRisk: hookCanCreate, canEditRisk: hookCanEdit, canDeleteRisk: hookCanDelete } = useRiskAccess(projectId);

// Si le projet est clôturé, forcer le mode lecture seule
const canCreateRisk = isProjectClosed ? false : hookCanCreate;
const canEditRisk = isProjectClosed ? false : hookCanEdit;
const canDeleteRisk = isProjectClosed ? false : hookCanDelete;
```

---

### 4. Modifier `ProjectNotesList.tsx`

#### a) Ajouter la prop `isProjectClosed`

```typescript
interface ProjectNotesListProps {
  projectId: string;
  canEdit: boolean;
  isAdmin: boolean;
  isProjectClosed?: boolean;  // NOUVEAU
}
```

#### b) Utiliser cette prop

```typescript
// Calculer la permission effective d'édition
const effectiveCanEdit = isProjectClosed ? false : canEdit;

// Utiliser effectiveCanEdit au lieu de canEdit dans le rendu
{effectiveCanEdit && !editingNote && (
  <ProjectNoteForm ... />
)}
```

---

### 5. Corriger `ProjectSummary.tsx` - Fallback pour `isProjectManager`

Le problème actuel est que `canReactivateProject` et `canCompleteEvaluation` dépendent de `projectPermissions.isProjectManager`, qui est calculé depuis la query asynchrone.

#### Solution : Calculer `isProjectManager` depuis les données du projet

```typescript
// Récupérer le profil de l'utilisateur courant pour comparer avec le chef de projet
const { userProfile } = usePermissionsContext();

// Déterminer si l'utilisateur est le chef de projet depuis les données du projet déjà chargées
const isCurrentUserProjectManager = project?.project_manager === userProfile?.email;

// Puis dans les permissions enrichies :
permissions={{
  ...projectPermissions,
  isProjectClosed: projectPermissions.isProjectClosed || (project?.lifecycle_status === 'completed'),
  hasPendingEvaluation: projectPermissions.hasPendingEvaluation || 
    (project?.lifecycle_status === 'completed' && project?.closure_status === 'pending_evaluation'),
  // Utiliser isCurrentUserProjectManager comme fallback
  isProjectManager: projectPermissions.isProjectManager || isCurrentUserProjectManager,
  canReactivateProject: projectPermissions.canReactivateProject ?? 
    ((project?.lifecycle_status === 'completed') && 
     (projectPermissions.isAdmin || isCurrentUserProjectManager)),
  canCompleteEvaluation: projectPermissions.canCompleteEvaluation ?? 
    ((project?.lifecycle_status === 'completed' && project?.closure_status === 'pending_evaluation') && 
     (projectPermissions.isAdmin || isCurrentUserProjectManager))
}}
```

---

## Résumé des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/ProjectSummary.tsx` | Utiliser `userProfile` pour calculer `isProjectManager` en fallback |
| `src/components/project/ProjectSummaryContent.tsx` | Calculer permissions effectives et les transmettre aux enfants |
| `src/components/TaskList.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |
| `src/components/RiskList.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |
| `src/components/notes/ProjectNotesList.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |

---

## Flux après correction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Premier rendu                                │
└─────────────────────────────────────────────────────────────────┘
                              │
     project chargé : lifecycle_status = 'completed'
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectSummary.tsx                                    │
     │  - isProjectClosed = project.lifecycle_status === 'completed' ✓    │
     │  - isProjectManager = project.project_manager === userProfile.email ✓│
     │  - canReactivateProject calculé correctement ✓         │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectSummaryContent reçoit :                        │
     │  - permissions.isProjectClosed = true ✓                │
     │  - permissions.canReactivateProject = true ✓           │
     │  - permissions.canCompleteEvaluation = true/false ✓    │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  Composants enfants reçoivent isProjectClosed :        │
     │  - TaskList : bouton "Nouvelle tâche" masqué ✓         │
     │  - RiskList : bouton "Nouveau risque" masqué ✓         │
     │  - ProjectNotesList : formulaire masqué ✓              │
     │  - TeamManagement : boutons masqués ✓                  │
     │                                                         │
     │  Boutons dans l'en-tête :                              │
     │  - Badge "Projet clôturé" ou "Évaluation en attente" ✓ │
     │  - Bouton "Réactiver" visible (admin/CDP) ✓            │
     │  - Bouton "Compléter l'évaluation" visible (si pending) ✓│
     └────────────────────────────────────────────────────────┘
```

---

## Avantages de cette solution

1. **Synchrone** : Utilise les données du projet déjà chargées, pas d'attente de query supplémentaire
2. **Cohérent** : Tous les composants reçoivent la même information de clôture
3. **Robuste** : Double source de vérité (prop + hook) avec priorité à la prop
4. **Maintenable** : Pattern clair de "permission override" pour l'état de clôture

---

## Tests recommandés

1. **Accès direct à un projet clôturé** (via URL)
   - Vérifier que le badge s'affiche immédiatement
   - Vérifier que tous les boutons d'action sont masqués dans les onglets
   - Vérifier que le bouton "Réactiver" est visible pour admin/CDP

2. **Projet avec évaluation en attente**
   - Vérifier que le badge orange "Évaluation en attente" s'affiche
   - Vérifier que le bouton "Compléter l'évaluation" est visible
   - Vérifier que les actions sont également désactivées

3. **Navigation depuis la liste des projets**
   - Charger la liste des projets
   - Cliquer sur un projet clôturé
   - Vérifier l'affichage immédiat correct
