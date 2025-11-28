-- Ajouter les champs pour suivre le tutoriel de prise en main
-- Permet de savoir si l'utilisateur a déjà vu le tutoriel

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean NOT NULL DEFAULT false;

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS onboarding_seen_at timestamp with time zone DEFAULT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN user_preferences.has_seen_onboarding IS 'Indique si l''utilisateur a déjà vu le tutoriel de prise en main';
COMMENT ON COLUMN user_preferences.onboarding_seen_at IS 'Date et heure de la dernière visualisation du tutoriel';