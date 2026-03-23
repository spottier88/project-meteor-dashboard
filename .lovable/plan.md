

# Mise à jour de `projects` après suppression de la dernière revue

## Diagnostic

Lors de la **création** d'une revue, le frontend met à jour directement la table `projects` (colonnes `status`, `progress`, `last_review_date`) avec les valeurs de la revue (lignes 161-169 de `ReviewSheet.tsx`).

Lors de la **suppression** d'une revue via `DeleteReviewDialog`, seules les tables `reviews` et `review_actions` sont nettoyées. **La table `projects` n'est jamais mise à jour**, donc les anciennes valeurs de météo, progression et date restent affichées.

## Solution

Créer un **trigger PostgreSQL** `AFTER DELETE` sur la table `reviews` qui recalcule automatiquement `status`, `progress` et `last_review_date` du projet concerné à partir de la revue précédente (ou NULL s'il n'en reste plus).

Cette approche est préférable à une correction frontend car :
- Elle couvre tous les points de suppression (DeleteReviewDialog, ReactivateProjectButton, clôture)
- Elle garantit la cohérence quelle que soit l'origine de la suppression

## Migration SQL

```sql
CREATE OR REPLACE FUNCTION sync_project_after_review_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- Mettre à jour avec les données de la revue précédente
    UPDATE projects SET
      status = _prev_review.weather,
      progress = _prev_review.progress,
      last_review_date = _prev_review.created_at
    WHERE id = OLD.project_id;
  ELSE
    -- Plus aucune revue : remettre à NULL
    UPDATE projects SET
      status = NULL,
      progress = NULL,
      last_review_date = NULL
    WHERE id = OLD.project_id;
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_sync_project_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION sync_project_after_review_delete();
```

## Rafraîchissement de la vue matérialisée

La vue `latest_reviews` doit aussi être rafraîchie. Ajouter dans le trigger :

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY latest_reviews;
```

Ou, si un trigger de refresh existe déjà sur `reviews`, vérifier qu'il couvre le `DELETE`.

## Fichiers impactés

- **Migration SQL uniquement** : 1 fonction + 1 trigger
- **Aucune modification frontend** : le `DeleteReviewDialog` invalide déjà les query keys nécessaires, le cache React Query se rafraîchira avec les bonnes données une fois la table `projects` mise à jour par le trigger

