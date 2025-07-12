
-- Supprimer l'ancienne politique ALL qui cause la circularité
DROP POLICY IF EXISTS "Portfolio managers can manage assignments" ON portfolio_managers;

-- Créer une politique INSERT spécifique pour l'auto-insertion lors de la création
CREATE POLICY "Allow creator auto-insertion" 
ON portfolio_managers 
FOR INSERT 
WITH CHECK (
    role = 'owner' AND
    EXISTS (
        SELECT 1 FROM project_portfolios pp
        WHERE pp.id = portfolio_id 
        AND pp.created_by = user_id
    )
);

-- Créer une politique INSERT pour les gestionnaires autorisés
CREATE POLICY "Authorized managers can insert" 
ON portfolio_managers 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) OR
    can_manage_portfolio(auth.uid(), portfolio_id)
);

-- Créer une politique SELECT pour voir les assignations
CREATE POLICY "View portfolio assignments" 
ON portfolio_managers 
FOR SELECT 
USING (can_view_portfolio(auth.uid(), portfolio_id));

-- Créer une politique UPDATE pour modifier les assignations
CREATE POLICY "Update portfolio assignments" 
ON portfolio_managers 
FOR UPDATE 
USING (can_manage_portfolio(auth.uid(), portfolio_id));

-- Créer une politique DELETE pour supprimer les assignations
CREATE POLICY "Delete portfolio assignments" 
ON portfolio_managers 
FOR DELETE 
USING (can_manage_portfolio(auth.uid(), portfolio_id));
