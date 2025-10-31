-- Ajout de la colonne difficulties dans la table reviews
ALTER TABLE reviews 
ADD COLUMN difficulties text;

COMMENT ON COLUMN reviews.difficulties IS 'Difficultés en cours rencontrées lors de la revue du projet';