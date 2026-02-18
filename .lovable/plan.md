

# Bilan de tache a la cloture - Saisie du resultat

## Objectif

Permettre a l'utilisateur de saisir un bilan/resultat lorsqu'une tache passe au statut "Termine". Le champ apparait de maniere contextuelle dans le formulaire d'edition existant, sans alourdir l'interface.

## Scenario retenu

Lorsque l'utilisateur change le statut d'une tache vers "Termine" (dans le formulaire d'edition), un champ **"Bilan / Resultat"** (`Textarea`) apparait sous le selecteur de statut avec une animation douce. Ce champ est :
- **Optionnel** : l'utilisateur peut terminer une tache sans remplir le bilan
- **Persistant** : une fois saisi, le bilan reste visible et modifiable tant que le statut est "Termine"
- **Visible en lecture** : affiche dans les vues carte (Kanban), tableau et "Mes taches" avec une icone distincte
- **Coherent avec la cloture projet** : le bilan de tache alimente naturellement les revues de projet et le processus de cloture

Ce scenario est leger car il n'ajoute aucune etape supplementaire (pas de dialog, pas de popup), juste un champ conditionnel dans le formulaire existant.

---

## Modifications techniques

### 1. Base de donnees

Migration SQL :

```sql
ALTER TABLE tasks ADD COLUMN completion_comment text;
```

### 2. Types

Ajouter `completion_comment?: string | null` dans :
- `TaskData` (dans `TaskFormTypes.ts`)
- `UseTaskFormParams.task`
- Les interfaces `Task` locales de `KanbanBoard.tsx`, `TaskTable.tsx`, `TaskCard.tsx`

### 3. Hooks (3 fichiers)

| Fichier | Modification |
|---------|-------------|
| `useTaskFormInitialization.ts` | Ajouter un `useState` pour `completionComment`, initialise depuis `task?.completion_comment` |
| `useTaskForm.tsx` | Propager `completionComment` / `setCompletionComment`, inclure dans `taskData` |
| `useUnsavedChangesTracker.ts` | Ajouter `completionComment` au suivi des modifications |

### 4. Formulaire (`TaskFormContent.tsx`)

Ajouter un bloc conditionnel sous le selecteur de statut :

```text
[Statut : Termine]
   |
   v (apparait uniquement si statut === "done")
[Textarea "Bilan / Resultat de la tache"]
   placeholder: "Decrivez le resultat, les livrables ou les conclusions..."
```

En mode lecture seule (`readOnlyFields`), afficher le texte du bilan s'il existe.

### 5. Vues d'affichage

- **KanbanBoard.tsx** : afficher le bilan sous la description pour les taches terminees, avec une icone `ClipboardCheck` et un texte tronque
- **TaskTable.tsx** : ajouter une icone `ClipboardCheck` a cote du titre si `completion_comment` est renseigne, avec un tooltip affichant le contenu
- **TaskCard.tsx** : afficher le bilan de la meme maniere que dans le Kanban

### 6. `TaskForm.tsx`

Propager les nouvelles props `completionComment` et `setCompletionComment` vers `TaskFormContent`.

---

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajout colonne `completion_comment` |
| `src/components/task/types/TaskFormTypes.ts` | Ajout du champ aux interfaces |
| `src/components/task/hooks/useTaskFormInitialization.ts` | Nouvel etat |
| `src/components/task/hooks/useTaskForm.tsx` | Propagation et inclusion dans taskData |
| `src/components/task/hooks/useUnsavedChangesTracker.ts` | Suivi des modifications |
| `src/components/task/TaskFormContent.tsx` | Champ conditionnel bilan |
| `src/components/task/TaskForm.tsx` | Propagation des props |
| `src/components/KanbanBoard.tsx` | Affichage bilan dans les cartes |
| `src/components/task/TaskTable.tsx` | Icone + tooltip bilan |
| `src/components/task/TaskCard.tsx` | Affichage bilan |

## Sequencement

1. Migration SQL
2. Mise a jour des types
3. Mise a jour des hooks (initialization, form, tracker)
4. Mise a jour du formulaire (TaskFormContent + TaskForm)
5. Mise a jour des vues (KanbanBoard, TaskTable, TaskCard)

