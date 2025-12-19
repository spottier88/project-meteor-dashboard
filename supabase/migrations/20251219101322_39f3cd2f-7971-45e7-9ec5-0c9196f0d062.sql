-- Ajouter la colonne profile_reminder_dismissed_until à user_preferences
-- Cette colonne permet de stocker la date jusqu'à laquelle le rappel de profil incomplet est reporté

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS profile_reminder_dismissed_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;