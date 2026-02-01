

# Plan de correction : Propagation du statut clôturé aux composants enfants

## Problème identifié

Les boutons de modification/suppression dans les listes de tâches et de risques restent visibles au premier chargement car les composants enfants (`TaskTable`, `RiskCard`) appellent **leurs propres hooks de permissions** au lieu d'utiliser la prop `isProjectClosed` déjà calculée par le parent.

### Flux actuel problématique

```text
ProjectSummaryContent
    │
    ├── isProjectClosed = true (calculé synchrone depuis project.lifecycle_status)
    │
    ├── TaskList (reçoit isProjectClosed = true) ✓
    │       │
    │       └── TaskTable (ne reçoit PAS isProjectClosed)
    │               │
    │               └── useTaskPermissions() ← Appel asynchrone direct
    │                       │
    │                       └── Au 1er rendu: projectAccess = undefined
    │                                         isProjectClosed = false ✗
    │
    └── RiskList (reçoit isProjectClosed = true) ✓
            │
            └── RiskCard (ne reçoit PAS isProjectClosed)
                    │
                    └── useRiskAccess() ← Appel asynchrone direct
                            │
                            └── Au 1er rendu: projectAccess = undefined
                                              isProjectClosed = false ✗
```

---

## Solution proposée

### Approche : Transmettre `isProjectClosed` aux composants enfants

Modifier les composants pour qu'ils reçoivent la prop `isProjectClosed` depuis le parent au lieu de la calculer eux-mêmes.

---

## Modifications à effectuer

### 1. Modifier `TaskTable.tsx`

#### a) Ajouter la prop `isProjectClosed` à l'interface

```typescript
interface TaskTableProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isProjectClosed?: boolean;  // NOUVEAU
}
```

#### b) Utiliser cette prop pour calculer les permissions effectives

```typescript
export const TaskTable = ({ tasks, onEdit, onDelete, isProjectClosed = false }: TaskTableProps) => {
  // ...
  const { canEditTask: hookCanEdit, canDeleteTask: hookCanDelete } = useTaskPermissions(tasks[0]?.project_id || "");

  // Forcer lecture seule si projet clôturé
  const canEditTask = (assignee?: string) => isProjectClosed ? false : hookCanEdit(assignee);
  const canDeleteTask = isProjectClosed ? false : hookCanDelete;
  
  // Utiliser ces variables au lieu des valeurs du hook
```

---

### 2. Modifier `TaskList.tsx`

#### Transmettre `isProjectClosed` à `TaskTable`

```tsx
<TaskTable
  tasks={filteredTasks || []}
  onEdit={(task) => { ... }}
  onDelete={task => { ... }}
  isProjectClosed={isProjectClosed}  // NOUVEAU
/>
```

Aussi pour les autres vues (KanbanBoard, TaskGantt) si elles utilisent des permissions.

---

### 3. Modifier `RiskCard.tsx`

#### a) Ajouter la prop `isProjectClosed` à l'interface

```typescript
interface RiskCardProps {
  risk: { ... };
  onEdit: (risk: any) => void;
  onDelete: (risk: any) => void;
  isProjectClosed?: boolean;  // NOUVEAU
}
```

#### b) Utiliser cette prop pour calculer les permissions

```typescript
export const RiskCard = ({ risk, onEdit, onDelete, isProjectClosed = false }: RiskCardProps) => {
  const { canEditRisk: hookCanEdit, canDeleteRisk: hookCanDelete } = useRiskAccess(risk.project_id);

  // Forcer lecture seule si projet clôturé
  const canEditRisk = isProjectClosed ? false : hookCanEdit;
  const canDeleteRisk = isProjectClosed ? false : hookCanDelete;
  
  // ...
```

---

### 4. Modifier `RiskList.tsx`

#### Transmettre `isProjectClosed` à `RiskCard`

```tsx
{risks.map((risk) => (
  <RiskCard
    key={risk.id}
    risk={risk}
    onEdit={handleEdit}
    onDelete={handleDelete}
    isProjectClosed={isProjectClosed}  // NOUVEAU
  />
))}
```

---

### 5. Modifier `RiskTable.tsx` (si utilisé)

#### a) Ajouter la prop `isProjectClosed`

```typescript
interface RiskTableProps {
  risks: Risk[];
  projectId: string;
  onEdit?: (risk: Risk) => void;
  onDelete?: (risk: Risk) => void;
  isProjectClosed?: boolean;  // NOUVEAU
}
```

#### b) Utiliser cette prop

```typescript
export const RiskTable = ({ risks, projectId, onEdit, onDelete, isProjectClosed = false }: RiskTableProps) => {
  const { canEditRisk: hookCanEdit, canDeleteRisk: hookCanDelete } = useRiskAccess(projectId);

  // Forcer lecture seule si projet clôturé
  const canEditRisk = isProjectClosed ? false : hookCanEdit;
  const canDeleteRisk = isProjectClosed ? false : hookCanDelete;
```

---

### 6. Modifier `KanbanBoard.tsx` (si nécessaire)

Vérifier si le composant utilise des permissions pour les boutons d'édition et ajouter la prop `isProjectClosed` le cas échéant.

---

## Résumé des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/task/TaskTable.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |
| `src/components/TaskList.tsx` | Transmettre `isProjectClosed` à `TaskTable`, `KanbanBoard`, `TaskGantt` |
| `src/components/risk/RiskCard.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |
| `src/components/RiskList.tsx` | Transmettre `isProjectClosed` à `RiskCard` |
| `src/components/risk/RiskTable.tsx` | Ajouter prop `isProjectClosed` et l'utiliser pour forcer lecture seule |
| `src/components/KanbanBoard.tsx` | (Optionnel) Ajouter prop `isProjectClosed` si boutons d'édition présents |

---

## Flux après correction

```text
ProjectSummaryContent
    │
    ├── isProjectClosed = true (synchrone depuis project.lifecycle_status)
    │
    ├── TaskList (reçoit isProjectClosed = true) ✓
    │       │
    │       └── TaskTable (reçoit isProjectClosed = true) ✓
    │               │
    │               ├── useTaskPermissions() → hookCanEdit = true (async)
    │               │
    │               └── canEditTask = isProjectClosed ? false : hookCanEdit
    │                                = true ? false : true
    │                                = FALSE ✓
    │
    └── RiskList (reçoit isProjectClosed = true) ✓
            │
            └── RiskCard (reçoit isProjectClosed = true) ✓
                    │
                    ├── useRiskAccess() → hookCanEdit = true (async)
                    │
                    └── canEditRisk = isProjectClosed ? false : hookCanEdit
                                    = true ? false : true
                                    = FALSE ✓
```

---

## Détails techniques

### Pattern de "permission override"

Le pattern utilisé consiste à :

1. **Récupérer les permissions depuis le hook** (qui peut être asynchrone)
2. **Appliquer un override synchrone** basé sur la prop `isProjectClosed`

```typescript
// Exemple dans TaskTable.tsx
const { canEditTask: hookCanEdit, canDeleteTask: hookCanDelete } = useTaskPermissions(projectId);

// Override synchrone
const canEditTask = (assignee?: string) => isProjectClosed ? false : hookCanEdit(assignee);
const canDeleteTask = isProjectClosed ? false : hookCanDelete;

// Puis dans le JSX
{canEditTask(task.assignee) && (
  <Button onClick={() => onEdit?.(task)}>
    <Pencil className="h-4 w-4" />
  </Button>
)}
```

Ce pattern garantit que :
- **Au premier rendu** : `isProjectClosed = true` → boutons masqués immédiatement ✓
- **Après chargement du hook** : La logique reste correcte car le hook retournera aussi `canEdit = false`

---

## Avantages de cette solution

1. **Synchrone** : Le statut clôturé est transmis immédiatement depuis le parent
2. **Cohérent** : Tous les niveaux de composants reçoivent la même information
3. **Robuste** : Double source de vérité (prop + hook) avec priorité à la prop
4. **Non-cassant** : Les hooks restent fonctionnels pour les cas où la prop n'est pas fournie

---

## Tests recommandés

1. **Accès direct à un projet clôturé**
   - Naviguer vers `/projects/{id}` d'un projet clôturé
   - Vérifier que les boutons modifier/supprimer sont masqués dans TaskTable
   - Vérifier que les boutons sont masqués dans RiskCard

2. **Changement d'onglet**
   - Cliquer sur l'onglet "Tâches" puis "Risques"
   - Vérifier que les boutons restent masqués

3. **Vue Kanban des tâches**
   - Basculer en vue Kanban
   - Vérifier que les actions d'édition sont désactivées

4. **Réactivation du projet**
   - Cliquer sur "Réactiver le projet"
   - Vérifier que les boutons réapparaissent

