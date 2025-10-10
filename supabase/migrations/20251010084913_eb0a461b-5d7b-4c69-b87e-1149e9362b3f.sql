-- Ajouter la colonne points_visualization_mode à la table user_preferences
ALTER TABLE user_preferences 
ADD COLUMN points_visualization_mode TEXT NOT NULL DEFAULT 'classic' 
CHECK (points_visualization_mode IN ('classic', 'cookies'));