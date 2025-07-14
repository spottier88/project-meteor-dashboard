
-- Corriger la récursion infinie dans les politiques RLS de portfolio_managers

-- Supprimer la politique SELECT problématique
DROP POLICY IF EXISTS "Simple portfolio managers select policy" ON portfolio_managers;

-- Créer une nouvelle politique SELECT sans récursion
CREATE POLICY "Simple portfolio managers select policy"
ON portfolio_managers
FOR SELECT
USING (
    -- Admin peut tout voir
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR
    -- Peut voir les assignations des portefeuilles qu'on a créés
    EXISTS (
        SELECT 1 FROM project_portfolios pp
        WHERE pp.id = portfolio_id
        AND pp.created_by = auth.uid()
    )
    OR
    -- Peut voir ses propres assignations
    user_id = auth.uid()
);
