-- Table pour stocker les projets favoris de chaque utilisateur
CREATE TABLE public.project_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(user_id, project_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_project_favorites_user_id ON public.project_favorites(user_id);

-- Activation de RLS
ALTER TABLE public.project_favorites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : chaque utilisateur ne voit/gère que ses propres favoris
CREATE POLICY "Users can view their own favorites" 
  ON public.project_favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" 
  ON public.project_favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
  ON public.project_favorites FOR DELETE 
  USING (auth.uid() = user_id);