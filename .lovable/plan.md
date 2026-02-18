

# Ajout d'un lien document (OneDrive/SharePoint) aux taches

## Objectif

Permettre d'associer un lien vers un document OneDrive ou SharePoint a une tache de projet. Seul le lien (URL) est stocke, pas le document lui-meme. Le lien est editable depuis le formulaire de tache et visible dans les vues carte (Kanban) et tableau.

---

## Modifications

### 1. Base de donnees

Ajouter une colonne `document_url` (type `text`, nullable) a la table `tasks` via une migration SQL :

```sql
ALTER TABLE tasks ADD COLUMN document_url text;
```

Aucune RLS supplementaire n'est necessaire : les politiques existantes sur `tasks` s'appliquent.

### 2. Types

Ajouter `document_url?: string` dans :
- `TaskData` (dans `src/components/task/types/TaskFormTypes.ts`)
- `UseTaskFormParams.task`
- L'interface `Task` locale de `TaskTable.tsx` et `KanbanBoard.tsx`
- L'interface `TaskCardProps.task` dans `TaskCard.tsx`

### 3. Formulaire de tache (`TaskFormContent.tsx`)

Ajouter un champ de saisie URL apres la description, avec :
- Un label "Lien document (OneDrive / SharePoint)"
- Un champ `Input` de type `url` avec placeholder
- Une validation basique du format URL (pattern https://)
- Visible uniquement si `readOnlyFields` est `false`, sinon affiche le lien en lecture seule (cliquable)

### 4. Hook de formulaire

Modifications dans 3 fichiers :
- **`useTaskFormInitialization.ts`** : ajouter un `useState` pour `documentUrl`, initialise depuis `task?.document_url`, et reinitialise dans `resetForm`
- **`useTaskForm.tsx`** : propager `documentUrl` / `setDocumentUrl` et l'inclure dans `taskData` lors du `handleSubmit`
- **`useUnsavedChangesTracker.ts`** : suivre les changements de `documentUrl`

### 5. Affichage dans les vues

- **KanbanBoard.tsx** (vue carte) : ajouter sous la date d'echeance une ligne avec une icone fichier et le lien cliquable (texte tronque, ouverture dans un nouvel onglet)
- **TaskTable.tsx** (vue tableau) : ajouter une icone cliquable dans la colonne Titre (ou une colonne dediee) si `document_url` est renseigne
- **TaskCard.tsx** (vue Mes taches) : ajouter le lien document si present

---

## Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| Migration SQL | `ALTER TABLE tasks ADD COLUMN document_url text` |
| `src/components/task/types/TaskFormTypes.ts` | Ajouter `document_url` aux interfaces |
| `src/components/task/hooks/useTaskFormInitialization.ts` | Nouvel etat `documentUrl` |
| `src/components/task/hooks/useTaskForm.tsx` | Propager `documentUrl`, inclure dans `taskData` |
| `src/components/task/hooks/useUnsavedChangesTracker.ts` | Tracker `documentUrl` |
| `src/components/task/TaskFormContent.tsx` | Nouveau champ URL + props |
| `src/components/task/TaskForm.tsx` | Propager `documentUrl` au contenu |
| `src/components/KanbanBoard.tsx` | Afficher le lien dans les cartes |
| `src/components/task/TaskTable.tsx` | Afficher une icone lien dans le tableau |
| `src/components/task/TaskCard.tsx` | Afficher le lien dans la vue Mes taches |

---

## Sequencement

1. Migration SQL (ajout colonne)
2. Mise a jour des types (`TaskFormTypes.ts`)
3. Mise a jour des hooks (initialization, form, tracker)
4. Mise a jour du formulaire (`TaskFormContent.tsx` + `TaskForm.tsx`)
5. Mise a jour des vues (KanbanBoard, TaskTable, TaskCard)

