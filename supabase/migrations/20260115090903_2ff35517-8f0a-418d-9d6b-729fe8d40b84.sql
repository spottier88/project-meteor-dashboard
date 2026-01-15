-- Table pour les notes de projet (bloc-notes / journal de bord)
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'memo' CHECK (note_type IN ('meeting', 'memo', 'decision', 'other')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX idx_project_notes_author_id ON public.project_notes(author_id);
CREATE INDEX idx_project_notes_created_at ON public.project_notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : utilisateurs ayant accès au projet (chef de projet, membre, admin)
CREATE POLICY "Users can view notes for their projects"
ON public.project_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_notes.project_id
    AND (
      -- Admin
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      -- Chef de projet
      OR p.project_manager_id = auth.uid()
      -- Membre du projet
      OR EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Politique d'insertion : utilisateurs ayant accès au projet
CREATE POLICY "Users can create notes for their projects"
ON public.project_notes
FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_notes.project_id
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      OR p.project_manager_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Politique de mise à jour : auteur de la note ou admin
CREATE POLICY "Users can update their own notes"
ON public.project_notes
FOR UPDATE
USING (
  author_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- Politique de suppression : auteur de la note ou admin
CREATE POLICY "Users can delete their own notes"
ON public.project_notes
FOR DELETE
USING (
  author_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();