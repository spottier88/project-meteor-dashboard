
-- Corriger la politique INSERT pour project_portfolios
DROP POLICY IF EXISTS "Portfolio managers can insert portfolios" ON project_portfolios;

CREATE POLICY "Portfolio managers can insert portfolios" 
ON project_portfolios 
FOR INSERT 
WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'portfolio_manager')
    )
);
