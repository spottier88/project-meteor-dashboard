-- Fonction trigger : synchronise projects après suppression d'une revue
CREATE OR REPLACE FUNCTION sync_project_after_review_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev_review RECORD;
BEGIN
  -- Chercher la revue la plus récente restante pour ce projet
  SELECT weather, progress, created_at
  INTO _prev_review
  FROM reviews
  WHERE project_id = OLD.project_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE projects SET
      status = _prev_review.weather,
      progress = _prev_review.progress,
      last_review_date = _prev_review.created_at
    WHERE id = OLD.project_id;
  ELSE
    UPDATE projects SET
      status = NULL,
      progress = NULL,
      last_review_date = NULL
    WHERE id = OLD.project_id;
  END IF;

  RETURN OLD;
END;
$$;

-- Trigger AFTER DELETE sur reviews
CREATE TRIGGER trg_sync_project_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION sync_project_after_review_delete();