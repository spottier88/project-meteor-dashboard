-- Créer une fonction SECURITY DEFINER pour vérifier l'accès aux portefeuilles sans récursion
CREATE OR REPLACE FUNCTION public.can_view_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Admin peut tout voir
    IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Créateur du portefeuille
    IF EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id
        AND created_by = p_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Utilisateur référencé dans portfolio_managers (owner, manager OU viewer)
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id
        AND pm.user_id = p_user_id
    );
END;
$$;

-- Supprimer l'ancienne politique qui cause la récursion
DROP POLICY IF EXISTS "Simple portfolio select policy" ON project_portfolios;

-- Créer la nouvelle politique utilisant la fonction SECURITY DEFINER
CREATE POLICY "Simple portfolio select policy"
ON project_portfolios FOR SELECT
USING (public.can_view_portfolio(auth.uid(), id));