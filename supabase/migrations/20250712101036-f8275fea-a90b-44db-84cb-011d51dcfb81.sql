
-- Supprimer les triggers et fonctions redondants qui causent des insertions en double

-- 1. Supprimer les triggers redondants (garder seulement trigger_auto_add_portfolio_owner)
DROP TRIGGER IF EXISTS add_portfolio_creator_as_owner ON project_portfolios;
DROP TRIGGER IF EXISTS auto_add_portfolio_creator ON project_portfolios;
DROP TRIGGER IF EXISTS ensure_portfolio_owner ON project_portfolios;

-- 2. Supprimer les fonctions obsolètes
DROP FUNCTION IF EXISTS add_portfolio_creator_as_owner();
DROP FUNCTION IF EXISTS auto_add_portfolio_creator();
DROP FUNCTION IF EXISTS ensure_portfolio_owner();

-- 3. Vérifier que le trigger principal utilise bien ON CONFLICT DO NOTHING
-- (il devrait déjà être correct mais on s'assure)
DROP TRIGGER IF EXISTS trigger_auto_add_portfolio_owner ON project_portfolios;

CREATE TRIGGER trigger_auto_add_portfolio_owner
    AFTER INSERT ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_portfolio_owner();

-- 4. Mettre à jour la fonction pour être plus robuste
CREATE OR REPLACE FUNCTION auto_add_portfolio_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insérer automatiquement le créateur comme propriétaire du portefeuille
    -- avec gestion des conflits pour éviter les doublons
    INSERT INTO portfolio_managers (portfolio_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (portfolio_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;
