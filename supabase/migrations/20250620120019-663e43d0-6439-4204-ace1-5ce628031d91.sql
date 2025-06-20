
-- Créer la table des portefeuilles
CREATE TABLE public.project_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  strategic_objectives text,
  budget_total decimal,
  start_date date,
  end_date date,
  status text DEFAULT 'actif' CHECK (status IN ('actif', 'suspendu', 'termine')),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table de liaison pour les gestionnaires de portefeuille
CREATE TABLE public.portfolio_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES project_portfolios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_id, user_id)
);

-- Ajouter la colonne portfolio_id à la table projects
ALTER TABLE public.projects ADD COLUMN portfolio_id uuid REFERENCES project_portfolios(id);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.project_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_managers ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les droits de gestion de portefeuille
CREATE OR REPLACE FUNCTION public.can_manage_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin a tous les droits
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Gestionnaire de portefeuille avec accès
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id 
        AND pm.user_id = p_user_id 
        AND pm.role IN ('owner', 'manager')
    );
END;
$$;

-- Fonction pour vérifier les droits de vue de portefeuille
CREATE OR REPLACE FUNCTION public.can_view_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin a tous les droits
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Gestionnaire de portefeuille avec accès (tous les rôles)
    IF EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id 
        AND pm.user_id = p_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Manager dans la hiérarchie des projets du portefeuille
    RETURN EXISTS (
        SELECT 1 FROM projects p
        WHERE p.portfolio_id = p_portfolio_id
        AND can_manager_access_project(p_user_id, p.id)
    );
END;
$$;

-- Fonction pour récupérer les portefeuilles accessibles
CREATE OR REPLACE FUNCTION public.get_accessible_portfolios(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    strategic_objectives text,
    budget_total decimal,
    start_date date,
    end_date date,
    status text,
    created_by uuid,
    created_at timestamptz,
    updated_at timestamptz,
    project_count bigint,
    completed_projects bigint,
    average_completion numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.*,
        COUNT(p.id) as project_count,
        COUNT(CASE WHEN p.lifecycle_status = 'completed' THEN 1 END) as completed_projects,
        ROUND(AVG(COALESCE(lr.completion, 0)), 2) as average_completion
    FROM project_portfolios pp
    LEFT JOIN projects p ON p.portfolio_id = pp.id
    LEFT JOIN latest_reviews lr ON lr.project_id = p.id
    WHERE can_view_portfolio(p_user_id, pp.id)
    GROUP BY pp.id, pp.name, pp.description, pp.strategic_objectives, 
             pp.budget_total, pp.start_date, pp.end_date, pp.status, 
             pp.created_by, pp.created_at, pp.updated_at
    ORDER BY pp.created_at DESC;
END;
$$;

-- Politiques RLS pour project_portfolios
CREATE POLICY "Users can view accessible portfolios" 
ON public.project_portfolios 
FOR SELECT 
USING (can_view_portfolio(auth.uid(), id));

CREATE POLICY "Portfolio managers can insert portfolios" 
ON public.project_portfolios 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'portfolio_manager')
    )
);

CREATE POLICY "Portfolio managers can update their portfolios" 
ON public.project_portfolios 
FOR UPDATE 
USING (can_manage_portfolio(auth.uid(), id));

CREATE POLICY "Portfolio managers can delete their portfolios" 
ON public.project_portfolios 
FOR DELETE 
USING (can_manage_portfolio(auth.uid(), id));

-- Politiques RLS pour portfolio_managers
CREATE POLICY "Users can view portfolio assignments they can see" 
ON public.portfolio_managers 
FOR SELECT 
USING (can_view_portfolio(auth.uid(), portfolio_id));

CREATE POLICY "Portfolio managers can manage assignments" 
ON public.portfolio_managers 
FOR ALL 
USING (can_manage_portfolio(auth.uid(), portfolio_id));

-- Trigger pour ajouter automatiquement le créateur comme owner
CREATE OR REPLACE FUNCTION public.add_portfolio_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO portfolio_managers (portfolio_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$;

CREATE TRIGGER portfolio_creator_owner_trigger
    AFTER INSERT ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION add_portfolio_creator_as_owner();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_portfolio_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER portfolio_updated_at_trigger
    BEFORE UPDATE ON project_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_updated_at();
