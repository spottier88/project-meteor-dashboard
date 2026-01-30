-- Ajouter la policy DELETE manquante sur project_evaluations
-- Permet aux propriétaires du projet, admins et chefs de projet de supprimer les évaluations

CREATE POLICY "Users can delete project evaluations"
ON project_evaluations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM profiles pr
        WHERE pr.id = auth.uid()
        AND p.project_manager = pr.email
      )
    )
  )
);