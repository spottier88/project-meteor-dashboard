-- Étape 2 : Insertion du paramètre de quota de points hebdomadaire pour les activités
-- Valeur par défaut : 10 points par semaine
INSERT INTO application_settings (type, key, value)
VALUES ('activity', 'weekly_points_quota', '10')
ON CONFLICT (type, key) DO NOTHING;