-- Ajouter la valeur 'quality_manager' à l'enum user_role
-- Cette migration doit être exécutée séparément avant de pouvoir utiliser la nouvelle valeur
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'quality_manager';