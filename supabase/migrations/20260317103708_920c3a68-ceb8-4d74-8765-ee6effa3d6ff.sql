
-- Fonction de synchronisation du statut de la tâche parent
-- en fonction du statut des tâches filles
CREATE OR REPLACE FUNCTION public.sync_parent_task_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _parent_id uuid;
  _old_parent_id uuid;
  _all_done boolean;
  _parent_status text;
  _child_count integer;
BEGIN
  -- Déterminer le(s) parent_task_id concerné(s)
  IF TG_OP = 'DELETE' THEN
    _parent_id := OLD.parent_task_id;
    _old_parent_id := NULL;
  ELSE
    _parent_id := NEW.parent_task_id;
    -- Si le parent_task_id a changé (UPDATE), on doit aussi recalculer l'ancien parent
    IF TG_OP = 'UPDATE' AND OLD.parent_task_id IS DISTINCT FROM NEW.parent_task_id THEN
      _old_parent_id := OLD.parent_task_id;
    ELSE
      _old_parent_id := NULL;
    END IF;
  END IF;

  -- Traiter le parent actuel
  IF _parent_id IS NOT NULL THEN
    PERFORM _sync_single_parent(_parent_id);
  END IF;

  -- Traiter l'ancien parent si changement de parent_task_id
  IF _old_parent_id IS NOT NULL THEN
    PERFORM _sync_single_parent(_old_parent_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fonction interne pour synchroniser un seul parent
CREATE OR REPLACE FUNCTION public._sync_single_parent(_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _all_done boolean;
  _parent_status text;
  _child_count integer;
BEGIN
  -- Récupérer le statut actuel du parent
  SELECT status INTO _parent_status FROM tasks WHERE id = _parent_id;
  IF _parent_status IS NULL THEN RETURN; END IF;

  -- Compter les enfants et vérifier les statuts
  SELECT 
    count(*),
    bool_and(status = 'done')
  INTO _child_count, _all_done
  FROM tasks WHERE parent_task_id = _parent_id;

  -- Pas d'enfant : ne rien changer
  IF _child_count = 0 THEN
    RETURN;
  END IF;

  -- Toutes les filles "done" → parent "done"
  IF _all_done THEN
    UPDATE tasks SET status = 'done' WHERE id = _parent_id AND status != 'done';
  -- Au moins une fille non-done et parent est "todo" ou "done" → parent "in_progress"
  ELSIF _parent_status IN ('todo', 'done') THEN
    UPDATE tasks SET status = 'in_progress' WHERE id = _parent_id AND status IN ('todo', 'done');
  END IF;
END;
$$;

-- Trigger sur INSERT et UPDATE (statut ou parent_task_id modifié)
CREATE TRIGGER trg_sync_parent_on_upsert
AFTER INSERT OR UPDATE OF status, parent_task_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_parent_task_status();

-- Trigger sur DELETE
CREATE TRIGGER trg_sync_parent_on_delete
AFTER DELETE ON tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_parent_task_status();
