-- Fonction pour vérifier si un utilisateur peut accéder à un projet via un portefeuille
CREATE OR REPLACE FUNCTION public.can_access_project_via_portfolio(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Vérifier si l'utilisateur est membre d'un portefeuille contenant ce projet
  SELECT EXISTS (
    SELECT 1 
    FROM portfolio_projects pp
    INNER JOIN portfolio_managers pm ON pm.portfolio_id = pp.portfolio_id
    WHERE pp.project_id = p_project_id
    AND pm.user_id = p_user_id
  )
  OR EXISTS (
    -- Vérifier si l'utilisateur est le créateur du portefeuille
    SELECT 1
    FROM portfolio_projects pp
    INNER JOIN project_portfolios pf ON pf.id = pp.portfolio_id
    WHERE pp.project_id = p_project_id
    AND pf.created_by = p_user_id
  );
$$;