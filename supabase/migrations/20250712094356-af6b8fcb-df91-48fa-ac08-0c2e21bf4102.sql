
-- ====================================================================
-- REFONTE COMPLÈTE DES POLITIQUES RLS POUR LES PORTEFEUILLES
-- ====================================================================

-- Étape 1 : Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Portfolio managers can insert portfolios" ON project_portfolios;
DROP POLICY IF EXISTS "Portfolio managers can update their portfolios" ON project_portfolios;
DROP POLICY IF EXISTS "Portfolio managers can delete their portfolios" ON project_portfolios;
DROP POLICY IF EXISTS "Users can view accessible portfolios" ON project_portfolios;

DROP POLICY IF EXISTS "Allow creator auto-insertion" ON portfolio_managers;
DROP POLICY IF EXISTS "Authorized managers can insert" ON portfolio_managers;
DROP POLICY IF EXISTS "Update portfolio assignments" ON portfolio_managers;
DROP POLICY IF EXISTS "Delete portfolio assignments" ON portfolio_managers;
DROP POLICY IF EXISTS "Users can view portfolio assignments they can see" ON portfolio_managers;
DROP POLICY IF EXISTS "View portfolio assignments" ON portfolio_managers;

-- Étape 2 : Supprimer les anciennes fonctions RLS complexes
DROP FUNCTION IF EXISTS can_manage_portfolio(uuid, uuid);
DROP FUNCTION IF EXISTS can_view_portfolio(uuid, uuid);

-- Étape 3 : Créer des nouvelles fonctions RLS simples et directes
CREATE OR REPLACE FUNCTION is_portfolio_owner(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Vérifier si l'utilisateur est le créateur du portefeuille
    RETURN EXISTS (
        SELECT 1 FROM project_portfolios 
        WHERE id = p_portfolio_id 
        AND created_by = p_user_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION can_manage_portfolio_simple(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin peut tout gérer
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Créateur du portefeuille peut le gérer
    IF EXISTS (
        SELECT 1 FROM project_portfolios 
        WHERE id = p_portfolio_id 
        AND created_by = p_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Gestionnaire explicite du portefeuille peut le gérer
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers 
        WHERE portfolio_id = p_portfolio_id 
        AND user_id = p_user_id 
        AND role IN ('owner', 'manager')
    );
END;
$$;

-- Étape 4 : Créer les nouvelles politiques RLS simples pour project_portfolios

-- INSERT : Seuls les admins et portfolio_managers peuvent créer des portefeuilles
CREATE POLICY "Simple portfolio insert policy"
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

-- SELECT : Peut voir les portefeuilles dont on est créateur, gestionnaire, ou admin
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
    OR
    -- Gestionnaire peut voir les portefeuilles qu'il gère
    EXISTS (
        SELECT 1 FROM portfolio_managers 
        WHERE portfolio_id = id 
        AND user_id = auth.uid()
    )
);

-- UPDATE : Seuls les créateurs et admins peuvent modifier
CREATE POLICY "Simple portfolio update policy"
ON project_portfolios
FOR UPDATE
USING (can_manage_portfolio_simple(auth.uid(), id));

-- DELETE : Seuls les créateurs et admins peuvent supprimer
CREATE POLICY "Simple portfolio delete policy"
ON project_portfolios
FOR DELETE
USING (can_manage_portfolio_simple(auth.uid(), id));

-- Étape 5 : Créer les nouvelles politiques RLS simples pour portfolio_managers

-- INSERT : Les admins et créateurs de portefeuilles peuvent assigner des gestionnaires
CREATE POLICY "Simple portfolio managers insert policy"
ON portfolio_managers
FOR INSERT
WITH CHECK (
    -- Admin peut tout faire
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR
    -- Créateur du portefeuille peut assigner des gestionnaires
    EXISTS (
        SELECT 1 FROM project_portfolios 
        WHERE id = portfolio_id 
        AND created_by = auth.uid()
    )
    OR
    -- Auto-insertion du créateur comme propriétaire (trigger)
    (role = 'owner' AND EXISTS (
        SELECT 1 FROM project_portfolios 
        WHERE id = portfolio_id 
        AND created_by = user_id
    ))
);

-- SELECT : Peut voir les assignations des portefeuilles qu'on peut voir
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
    -- Peut voir les assignations des portefeuilles qu'on peut voir
    EXISTS (
        SELECT 1 FROM project_portfolios pp
        WHERE pp.id = portfolio_id
        AND (
            pp.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM portfolio_managers pm2
                WHERE pm2.portfolio_id = pp.id 
                AND pm2.user_id = auth.uid()
            )
        )
    )
);

-- UPDATE : Seuls les gestionnaires de portefeuilles peuvent modifier les assignations
CREATE POLICY "Simple portfolio managers update policy"
ON portfolio_managers
FOR UPDATE
USING (can_manage_portfolio_simple(auth.uid(), portfolio_id));

-- DELETE : Seuls les gestionnaires de portefeuilles peuvent supprimer les assignations
CREATE POLICY "Simple portfolio managers delete policy"
ON portfolio_managers
FOR DELETE
USING (can_manage_portfolio_simple(auth.uid(), portfolio_id));

-- Étape 6 : Créer un trigger pour auto-insertion du créateur comme propriétaire
CREATE OR REPLACE FUNCTION auto_add_portfolio_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insérer automatiquement le créateur comme propriétaire du portefeuille
    INSERT INTO portfolio_managers (portfolio_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (portfolio_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_add_portfolio_owner ON project_portfolios;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_auto_add_portfolio_owner
    AFTER INSERT ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_portfolio_owner();

-- Étape 7 : Ajouter une contrainte unique pour éviter les doublons
ALTER TABLE portfolio_managers 
DROP CONSTRAINT IF EXISTS portfolio_managers_portfolio_id_user_id_key;

ALTER TABLE portfolio_managers 
ADD CONSTRAINT portfolio_managers_portfolio_id_user_id_key 
UNIQUE (portfolio_id, user_id);
