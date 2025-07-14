
-- Correction complète pour éliminer tous les triggers redondants causant les doublons

-- 1. Supprimer TOUS les triggers possibles sur project_portfolios (même ceux avec des noms différents)
DROP TRIGGER IF EXISTS add_portfolio_creator_as_owner ON project_portfolios;
DROP TRIGGER IF EXISTS auto_add_portfolio_creator ON project_portfolios;
DROP TRIGGER IF EXISTS ensure_portfolio_owner ON project_portfolios;
DROP TRIGGER IF EXISTS trigger_auto_add_portfolio_owner ON project_portfolios;
DROP TRIGGER IF EXISTS add_portfolio_creator_trigger ON project_portfolios;
DROP TRIGGER IF EXISTS portfolio_creator_owner_trigger ON project_portfolios;

-- 2. Supprimer TOUTES les fonctions obsolètes (même celles avec des noms différents)
DROP FUNCTION IF EXISTS add_portfolio_creator_as_owner();
DROP FUNCTION IF EXISTS auto_add_portfolio_creator();
DROP FUNCTION IF EXISTS ensure_portfolio_owner();

-- 3. Créer UNE SEULE fonction robuste avec gestion des conflits
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

-- 4. Créer UN SEUL trigger utilisant cette fonction
CREATE TRIGGER trigger_auto_add_portfolio_owner
    AFTER INSERT ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_portfolio_owner();

-- 5. Vérifier qu'il n'y a pas de doublons existants dans portfolio_managers
-- (optionnel: nettoyer les doublons s'il y en a)
DELETE FROM portfolio_managers pm1
WHERE EXISTS (
    SELECT 1 FROM portfolio_managers pm2
    WHERE pm2.portfolio_id = pm1.portfolio_id
    AND pm2.user_id = pm1.user_id
    AND pm2.id > pm1.id
);
