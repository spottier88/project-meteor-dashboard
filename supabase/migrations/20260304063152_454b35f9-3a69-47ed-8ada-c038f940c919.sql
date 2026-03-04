
-- Table des tags de projets
CREATE TABLE public.project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, tag)
);

-- Index pour les recherches par tag
CREATE INDEX idx_project_tags_tag ON public.project_tags(tag);
CREATE INDEX idx_project_tags_project_id ON public.project_tags(project_id);

-- Activer RLS
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

-- Lecture : mêmes droits que les projets (via can_access_project)
CREATE POLICY "Users can view project tags"
  ON public.project_tags FOR SELECT
  TO authenticated
  USING (can_access_project(auth.uid(), project_id));

-- Écriture : admin ou chef de projet (via can_manage_project)
CREATE POLICY "Users can insert project tags"
  ON public.project_tags FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_project(auth.uid(), project_id));

CREATE POLICY "Users can delete project tags"
  ON public.project_tags FOR DELETE
  TO authenticated
  USING (can_manage_project(auth.uid(), project_id));
