-- Ajouter le champ activity_date pour supporter la saisie quotidienne
ALTER TABLE activity_points 
ADD COLUMN activity_date DATE;

-- Index pour améliorer les performances des requêtes par date
CREATE INDEX idx_activity_points_activity_date 
ON activity_points(user_id, activity_date);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN activity_points.activity_date IS 'Date spécifique du jour où les points sont alloués. Si NULL, les points sont répartis sur toute la semaine.';