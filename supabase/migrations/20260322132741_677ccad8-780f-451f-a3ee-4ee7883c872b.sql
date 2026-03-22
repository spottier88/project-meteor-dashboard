-- 1. Remplacer la politique SELECT sur project_portfolios
DROP POLICY IF EXISTS "Users can view portfolios they have access to" ON project_portfolios;
DROP POLICY IF EXISTS "portfolio_select_policy" ON project_portfolios;

-- Créer une politique SELECT directe (sans fonction qui re-query la table)
CREATE POLICY "portfolio_select_direct"
  ON project_portfolios FOR SELECT TO public
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM portfolio_managers WHERE portfolio_managers.portfolio_id = project_portfolios.id AND portfolio_managers.user_id = auth.uid())
  );

-- 2. Recréer la fonction auto_add_portfolio_owner
CREATE OR REPLACE FUNCTION auto_add_portfolio_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO portfolio_managers (portfolio_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_add_portfolio_owner ON project_portfolios;
CREATE TRIGGER trg_auto_add_portfolio_owner
  AFTER INSERT ON project_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_portfolio_owner();