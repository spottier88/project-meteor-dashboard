-- =====================================================
-- Table de liaison portfolio_projects pour relation N:M
-- Permet d'affecter un projet à plusieurs portefeuilles
-- =====================================================

-- Créer la table de liaison
CREATE TABLE public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.project_portfolios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID REFERENCES public.profiles(id),
  UNIQUE(portfolio_id, project_id) -- Empêche les doublons
);

-- Créer les index pour les performances
CREATE INDEX idx_portfolio_projects_portfolio_id ON public.portfolio_projects(portfolio_id);
CREATE INDEX idx_portfolio_projects_project_id ON public.portfolio_projects(project_id);

-- Activer RLS
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : utilisateurs ayant accès au portefeuille ou au projet
CREATE POLICY "Users can view portfolio_projects if they can access portfolio or project"
ON public.portfolio_projects
FOR SELECT
USING (
  -- Admins
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR
  -- Gestionnaires du portefeuille
  EXISTS (SELECT 1 FROM public.portfolio_managers WHERE portfolio_id = portfolio_projects.portfolio_id AND user_id = auth.uid())
  OR
  -- Créateur du portefeuille
  EXISTS (SELECT 1 FROM public.project_portfolios WHERE id = portfolio_projects.portfolio_id AND created_by = auth.uid())
  OR
  -- Chef de projet ou membre du projet
  can_access_project(auth.uid(), portfolio_projects.project_id)
);

-- Politique INSERT : utilisateurs pouvant gérer le portefeuille
CREATE POLICY "Users can add projects to portfolio if they can manage it"
ON public.portfolio_projects
FOR INSERT
WITH CHECK (
  can_manage_portfolio_simple(auth.uid(), portfolio_id)
);

-- Politique DELETE : utilisateurs pouvant gérer le portefeuille
CREATE POLICY "Users can remove projects from portfolio if they can manage it"
ON public.portfolio_projects
FOR DELETE
USING (
  can_manage_portfolio_simple(auth.uid(), portfolio_id)
);

-- Migrer les données existantes depuis projects.portfolio_id
INSERT INTO public.portfolio_projects (portfolio_id, project_id, added_at)
SELECT portfolio_id, id, COALESCE(created_at, now())
FROM public.projects 
WHERE portfolio_id IS NOT NULL
ON CONFLICT (portfolio_id, project_id) DO NOTHING;