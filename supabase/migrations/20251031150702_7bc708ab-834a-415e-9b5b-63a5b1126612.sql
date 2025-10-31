-- Recréer la vue latest_reviews pour inclure le champ difficulties
DROP VIEW IF EXISTS latest_reviews;

CREATE VIEW latest_reviews AS
SELECT DISTINCT ON (r.project_id) 
    r.project_id,
    r.id AS review_id,
    r.weather,
    r.progress,
    r.completion,
    r.created_at,
    r.comment,
    r.difficulties
FROM reviews r
ORDER BY r.project_id, r.created_at DESC;