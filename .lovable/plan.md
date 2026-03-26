

# Ordonnancement des taches dans un projet

## Objectif

Ajouter un champ `order_index` a la table `tasks` pour permettre un tri manuel des taches. Ce tri devient le tri par defaut dans tous les affichages (tableau, kanban, Gantt, export Excel, slides de presentation).

## Plan

### 1. Migration SQL — ajout de `order_index`

Ajouter une colonne `order_index integer NOT NULL DEFAULT 0` a la table `tasks`. Initialiser les valeurs existantes avec un index base sur `created_at` (les plus anciennes en premier) pour conserver un ordre coherent.

```sql
ALTER TABLE tasks ADD COLUMN order_index integer NOT NULL DEFAULT 0;

-- Initialiser l'ordre existant base sur la date de creation
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) AS rn
  FROM tasks
)
UPDATE tasks SET order_index = numbered.rn FROM numbered WHERE tasks.id = numbered.id;
```

### 2. Interface de reordonnancement — drag & drop dans `TaskTable`

- Integrer `@dnd-kit/core` + `@dnd-kit/sortable` (deja dans l'ecosysteme React) pour rendre les lignes du tableau reordonnables par glisser-deposer
- Ajouter une colonne "poignee" (icone `GripVertical`) en premiere position, visible uniquement si l'utilisateur a le droit d'edition et que le tri n'est pas actif sur une autre colonne
- Au drop, mettre a jour les `order_index` des taches concernees via un batch `UPDATE` Supabase
- Le drag & drop ne s'applique qu'aux taches parentes entre elles et aux sous-taches au sein de leur parent

### 3. Tri par defaut dans toutes les requetes

Remplacer `.order("created_at", { ascending: false })` par `.order("order_index", { ascending: true })` dans :

| Fichier | Requete |
|---|---|
| `src/components/TaskList.tsx` | Query principale des taches |
| `src/pages/TaskManagement.tsx` | Query d'export |
| `src/components/KanbanBoard.tsx` | Query des taches kanban |
| `src/components/review/TaskStatusUpdateSection.tsx` | Taches dans la revue |
| `src/pages/ProjectSummary.tsx` | Taches du resume projet |

### 4. Tri par defaut dans les affichages non-requete

- `TaskTable.tsx` : quand aucun tri par colonne n'est actif (`sortKey === null`), trier par `order_index` au lieu de ne pas trier
- `TaskGantt.tsx` : trier les taches par `order_index` avant de les passer au composant Gantt
- `PresentationSlide.tsx` : les taches arrivent deja triees par la requete, rien a changer
- `exportTasksToExcel` : les taches arrivent deja triees, rien a changer

### 5. Attribution automatique de l'ordre a la creation

- Dans `TaskForm.tsx` (ou le hook de creation de tache), lors de l'insertion d'une nouvelle tache, calculer `order_index = MAX(order_index) + 1` pour le `project_id` concerne (ou pour le `parent_task_id` si sous-tache)
- Alternative plus simple : un trigger SQL `BEFORE INSERT` qui attribue automatiquement le prochain `order_index`

### Fichiers impactes

| Fichier | Modification |
|---|---|
| Migration SQL | Ajout colonne + initialisation |
| `src/components/task/TaskTable.tsx` | Drag & drop + colonne poignee + tri par defaut |
| `src/components/TaskList.tsx` | Ordre de requete |
| `src/pages/TaskManagement.tsx` | Ordre de requete |
| `src/components/KanbanBoard.tsx` | Ordre de requete |
| `src/components/review/TaskStatusUpdateSection.tsx` | Ordre de requete |
| `src/pages/ProjectSummary.tsx` | Ordre de requete |
| `src/components/task/TaskForm.tsx` | Calcul order_index a l'insertion |
| `src/components/task/TaskGantt.tsx` | Tri par order_index |

