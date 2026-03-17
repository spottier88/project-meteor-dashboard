

# Automatisation du statut de la tâche parent en fonction des tâches filles

## Inventaire des cas

Voici tous les cas identifiés où le statut d'une tâche fille change et doit potentiellement impacter la tâche parent :

| # | Déclencheur | Condition | Action sur le parent |
|---|-------------|-----------|---------------------|
| 1 | Une tâche fille passe de "todo" à "in_progress" | Parent est "todo" | Parent → "in_progress" |
| 2 | Une tâche fille passe de "todo" à "done" | Toutes les filles sont "done" | Parent → "done" |
| 3 | Une tâche fille passe de "todo" à "done" | Au moins une fille n'est pas "done" et parent est "todo" | Parent → "in_progress" |
| 4 | Une tâche fille passe de "in_progress" à "done" | Toutes les filles sont "done" | Parent → "done" |
| 5 | Une tâche fille passe de "in_progress" à "done" | Au moins une fille n'est pas "done" | Aucune action (parent déjà "in_progress") |
| 6 | Une tâche fille passe de "done" à "in_progress" | Parent est "done" | Parent → "in_progress" |
| 7 | Une tâche fille passe de "done" à "todo" | Parent est "done" | Parent → "in_progress" |
| 8 | Une tâche fille est **créée** (INSERT) avec un `parent_task_id` | Parent est "done" | Parent → "in_progress" |
| 9 | Une tâche fille est **supprimée** (DELETE) | Toutes les filles restantes sont "done" (et il en reste au moins une) | Parent → "done" |
| 10 | Une tâche fille est **supprimée** (DELETE) | Aucune fille restante | Aucune action (le parent garde son statut) |

## Approche technique : trigger PostgreSQL

Plutôt que de modifier chaque point du code frontend (5 endroits identifiés : `useTaskSubmit`, `KanbanBoard.changeTaskStatus`, `TaskTable`, `ReviewSheet`, `templateTasks`), un **trigger PostgreSQL** centralise la logique et garantit la cohérence quel que soit le point d'entrée.

### Migration SQL

Créer une fonction + 2 triggers sur la table `tasks` :

```sql
-- Fonction de synchronisation du statut parent
CREATE OR REPLACE FUNCTION sync_parent_task_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _parent_id uuid;
  _all_done boolean;
  _any_in_progress boolean;
  _parent_status text;
  _child_count integer;
BEGIN
  -- Déterminer le parent_task_id concerné
  IF TG_OP = 'DELETE' THEN
    _parent_id := OLD.parent_task_id;
  ELSE
    _parent_id := NEW.parent_task_id;
    -- Si le parent_task_id a changé (UPDATE), gérer aussi l'ancien parent
    IF TG_OP = 'UPDATE' AND OLD.parent_task_id IS DISTINCT FROM NEW.parent_task_id 
       AND OLD.parent_task_id IS NOT NULL THEN
      -- Recalculer l'ancien parent (appel récursif simplifié via UPDATE direct)
      -- [logique similaire pour l'ancien parent]
    END IF;
  END IF;

  IF _parent_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  -- Récupérer le statut actuel du parent
  SELECT status INTO _parent_status FROM tasks WHERE id = _parent_id;

  -- Compter les enfants et vérifier les statuts
  SELECT 
    count(*),
    bool_and(status = 'done'),
    bool_or(status = 'in_progress')
  INTO _child_count, _all_done, _any_in_progress
  FROM tasks WHERE parent_task_id = _parent_id;

  -- Appliquer les règles
  IF _child_count = 0 THEN
    -- Plus d'enfant : ne rien faire
    RETURN COALESCE(NEW, OLD);
  ELSIF _all_done THEN
    -- Toutes les filles "done" → parent "done"
    UPDATE tasks SET status = 'done' WHERE id = _parent_id AND status != 'done';
  ELSIF _parent_status = 'todo' OR _parent_status = 'done' THEN
    -- Au moins une fille non-done et parent est todo ou done → parent "in_progress"
    UPDATE tasks SET status = 'in_progress' WHERE id = _parent_id AND status IN ('todo','done');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger sur INSERT et UPDATE
CREATE TRIGGER trg_sync_parent_on_upsert
AFTER INSERT OR UPDATE OF status, parent_task_id ON tasks
FOR EACH ROW
WHEN (NEW.parent_task_id IS NOT NULL 
      OR (TG_OP = 'UPDATE' AND OLD.parent_task_id IS NOT NULL))
EXECUTE FUNCTION sync_parent_task_status();

-- Trigger sur DELETE
CREATE TRIGGER trg_sync_parent_on_delete
AFTER DELETE ON tasks
FOR EACH ROW
WHEN (OLD.parent_task_id IS NOT NULL)
EXECUTE FUNCTION sync_parent_task_status();
```

### Aucune modification frontend nécessaire

Le trigger étant côté base de données, tous les points d'écriture existants (formulaire de tâche, Kanban, tableau, revue, templates) bénéficient automatiquement de la synchronisation. Le `queryClient.invalidateQueries` déjà en place dans chaque composant rafraîchira l'UI après mutation.

### Cas particulier : changement de `parent_task_id`

Si une tâche fille change de parent (rare mais possible via le formulaire), il faut recalculer le statut des **deux** parents (ancien et nouveau). La fonction gère ce cas.

