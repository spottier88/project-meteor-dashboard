
-- Corriger la récursion mutuelle entre project_portfolios et portfolio_managers

-- ===============================
-- ÉTAPE 1: Corriger project_portfolios
-- ===============================

-- Supprimer l'ancienne politique SELECT qui cause la récursion
DROP POLICY IF EXISTS "Simple portfolio select policy" ON project_portfolios;

-- Créer une nouvelle politique SELECT sans référence à portfolio_managers
CREATE POLICY "Simple portfolio select policy"
ON project_portfolios
FOR SELECT
USING (
    -- Admin peut tout voir
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR
    -- Créateur peut voir son portefeuille
    created_by = auth.uid()
);

-- ===============================
-- ÉTAPE 2: Corriger portfolio_managers  
-- ===============================

-- Supprimer l'ancienne politique SELECT qui cause la récursion
DROP POLICY IF EXISTS "Simple portfolio managers select policy" ON portfolio_managers;

-- Créer une nouvelle politique SELECT directe sans sous-requête complexe
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
    -- Peut voir ses propres assignations
    user_id = auth.uid()
    OR
    -- Le créateur d'un portefeuille peut voir ses gestionnaires
    portfolio_id IN (
        SELECT id FROM project_portfolios 
        WHERE created_by = auth.uid()
    )
);

-- ===============================
-- ÉTAPE 3: Ajuster les autres politiques si nécessaire
-- ===============================

-- Vérifier que les politiques UPDATE/DELETE utilisent des fonctions sécurisées
-- (elles utilisent déjà can_manage_portfolio_simple qui est SECURITY DEFINER)
