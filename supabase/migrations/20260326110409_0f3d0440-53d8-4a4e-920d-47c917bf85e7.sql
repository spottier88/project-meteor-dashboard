-- Ajout de la colonne order_index pour l'ordonnancement des tâches
ALTER TABLE tasks ADD COLUMN order_index integer NOT NULL DEFAULT 0;

-- Initialiser l'ordre existant basé sur la date de création
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) AS rn
  FROM tasks
)
UPDATE tasks SET order_index = numbered.rn FROM numbered WHERE tasks.id = numbered.id;

-- Trigger pour auto-attribuer le prochain order_index à l'insertion
CREATE OR REPLACE FUNCTION set_task_order_index()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_index = 0 THEN
    SELECT COALESCE(MAX(order_index), 0) + 1
    INTO NEW.order_index
    FROM tasks
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_task_order_index
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_order_index();