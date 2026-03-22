-- Casser la récursion mutuelle : supprimer la politique SELECT de portfolio_managers
-- qui référence project_portfolios, et la remplacer par une politique directe
DROP POLICY IF EXISTS "Simple portfolio managers select policy" ON portfolio_managers;

CREATE POLICY "portfolio_managers_select" ON portfolio_managers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    user_id = auth.uid()
  );