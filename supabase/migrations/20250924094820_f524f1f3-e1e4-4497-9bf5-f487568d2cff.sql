-- Correction du problème RLS sur project_codes
ALTER TABLE public.project_codes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour project_codes
CREATE POLICY "Users can view project codes they have access to"
ON public.project_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_codes.project_id
    AND can_access_project(auth.uid(), p.id)
  )
);

CREATE POLICY "Admins and project managers can manage project codes"
ON public.project_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_codes.project_id
    AND can_manage_project(auth.uid(), p.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_codes.project_id
    AND can_manage_project(auth.uid(), p.id)
  )
);