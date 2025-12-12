-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Simple portfolio select policy" ON project_portfolios;

-- Créer la nouvelle politique incluant les utilisateurs de portfolio_managers
CREATE POLICY "Simple portfolio select policy"
ON project_portfolios FOR SELECT
USING (
  -- Admin peut tout voir
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ))
  OR
  -- Créateur du portefeuille
  (created_by = auth.uid())
  OR
  -- Utilisateur référencé dans portfolio_managers (owner, manager OU viewer)
  (EXISTS (
    SELECT 1 FROM portfolio_managers pm
    WHERE pm.portfolio_id = project_portfolios.id
    AND pm.user_id = auth.uid()
  ))
);