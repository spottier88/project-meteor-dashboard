-- Table pour stocker les évaluations de méthode projet (Niveau 2)
CREATE TABLE public.project_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Évaluation de la méthode projet
  what_worked TEXT,           -- Ce qui a bien fonctionné
  what_was_missing TEXT,      -- Ce qui a manqué
  improvements TEXT,          -- Pistes d'amélioration
  lessons_learned TEXT,       -- Enseignements tirés
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contrainte d'unicité : une seule évaluation par projet
  UNIQUE(project_id)
);

-- Ajouter le champ is_final_review à la table reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_final_review BOOLEAN DEFAULT FALSE;

-- Ajouter les champs de clôture à la table projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS closure_status TEXT CHECK (closure_status IN ('pending_review', 'pending_evaluation', 'completed')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Activer RLS sur project_evaluations
ALTER TABLE public.project_evaluations ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : même accès que le projet (utilise la fonction existante can_access_project_via_portfolio)
CREATE POLICY "Users can view project evaluations"
ON public.project_evaluations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      OR can_access_project_via_portfolio(auth.uid(), p.id)
    )
  )
);

-- Politique d'insertion : uniquement les personnes pouvant éditer le projet
CREATE POLICY "Users can create project evaluations"
ON public.project_evaluations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  )
);

-- Politique de modification : uniquement les personnes pouvant éditer le projet
CREATE POLICY "Users can update project evaluations"
ON public.project_evaluations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  )
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_project_evaluations_updated_at
  BEFORE UPDATE ON public.project_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();