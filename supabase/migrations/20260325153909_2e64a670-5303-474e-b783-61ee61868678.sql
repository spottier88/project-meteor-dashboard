-- 1. Fonction SECURITY DEFINER pour vérifier les droits d'insertion dans portfolio_managers
-- Casse la chaîne de récursion en bypassant les politiques RLS
CREATE OR REPLACE FUNCTION public.can_insert_portfolio_manager(
  p_user_id uuid,
  p_portfolio_id uuid,
  p_target_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Admin peut tout faire
    IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id AND role = 'admin'
    ) THEN RETURN true; END IF;

    -- Créateur du portefeuille
    IF EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id AND created_by = p_user_id
    ) THEN RETURN true; END IF;

    -- Gestionnaire existant avec rôle owner ou manager
    IF EXISTS (
        SELECT 1 FROM portfolio_managers
        WHERE portfolio_id = p_portfolio_id
        AND user_id = p_user_id
        AND role IN ('owner', 'manager')
    ) THEN RETURN true; END IF;

    -- Insertion automatique du owner (trigger auto_add_portfolio_owner)
    IF p_role = 'owner' AND EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id AND created_by = p_target_user_id
    ) THEN RETURN true; END IF;

    RETURN false;
END;
$$;

-- 2. Remplacer la politique INSERT sur portfolio_managers
DROP POLICY "Simple portfolio managers insert policy" ON portfolio_managers;

CREATE POLICY "portfolio_managers_insert"
ON portfolio_managers FOR INSERT TO authenticated
WITH CHECK (
    can_insert_portfolio_manager(auth.uid(), portfolio_id, user_id, role)
);

-- 3. Remplacer la politique SELECT sur project_portfolios pour utiliser can_view_portfolio (SECURITY DEFINER)
DROP POLICY "portfolio_select_direct" ON project_portfolios;

CREATE POLICY "portfolio_select_via_function"
ON project_portfolios FOR SELECT TO authenticated
USING (can_view_portfolio(auth.uid(), id));