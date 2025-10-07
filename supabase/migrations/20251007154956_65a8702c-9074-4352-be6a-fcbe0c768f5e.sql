-- Étape 1 : Ajouter le type 'activity' à l'enum setting_type
ALTER TYPE setting_type ADD VALUE IF NOT EXISTS 'activity';