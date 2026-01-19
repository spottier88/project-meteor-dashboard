-- Ajout du champ teams_url à la table projects
ALTER TABLE projects 
ADD COLUMN teams_url TEXT DEFAULT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN projects.teams_url IS 'URL vers l''équipe Microsoft Teams associée au projet';