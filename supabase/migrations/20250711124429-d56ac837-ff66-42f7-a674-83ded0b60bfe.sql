
-- Améliorer la fonction can_view_portfolio pour inclure le créateur
CREATE OR REPLACE FUNCTION public.can_view_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin a tous les droits
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Le créateur du portefeuille peut toujours le voir
    IF EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id
        AND created_by = p_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Vérifier si l'utilisateur est gestionnaire du portefeuille
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id
        AND pm.user_id = p_user_id
    );
END;
$$;

-- Améliorer la fonction can_manage_portfolio pour inclure le créateur
CREATE OR REPLACE FUNCTION public.can_manage_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin a tous les droits
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Le créateur du portefeuille peut toujours le gérer
    IF EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id
        AND created_by = p_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Vérifier si l'utilisateur peut gérer ce portefeuille
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id
        AND pm.user_id = p_user_id
        AND pm.role IN ('manager', 'owner')
    );
END;
$$;

-- Créer une fonction trigger pour ajouter automatiquement le créateur comme propriétaire
CREATE OR REPLACE FUNCTION public.add_portfolio_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Ajouter le créateur du portefeuille comme propriétaire dans portfolio_managers
    INSERT INTO portfolio_managers (portfolio_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table project_portfolios
DROP TRIGGER IF EXISTS add_portfolio_creator_trigger ON project_portfolios;
CREATE TRIGGER add_portfolio_creator_trigger
    AFTER INSERT ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION add_portfolio_creator_as_owner();
