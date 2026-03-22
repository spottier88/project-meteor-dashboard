
-- Table de liaison modèle ↔ entité organisationnelle
CREATE TABLE public.project_template_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.project_templates(id) ON DELETE CASCADE NOT NULL,
  entity_type public.user_hierarchy_level NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, entity_type, entity_id)
);

ALTER TABLE public.project_template_visibility ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent gérer la visibilité des modèles
CREATE POLICY "Admins manage template visibility"
  ON public.project_template_visibility FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fonction RPC : retourne les modèles accessibles pour un utilisateur donné
CREATE OR REPLACE FUNCTION public.get_accessible_templates(p_user_id uuid)
RETURNS SETOF public.project_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT pt.*
  FROM project_templates pt
  WHERE pt.is_active = true
  AND (
    -- Aucune affectation = visible par tous
    NOT EXISTS (
      SELECT 1 FROM project_template_visibility ptv
      WHERE ptv.template_id = pt.id
    )
    OR
    -- Affectation correspondant à l'entité de l'utilisateur (avec héritage hiérarchique)
    EXISTS (
      SELECT 1
      FROM project_template_visibility ptv
      JOIN user_hierarchy_assignments uha ON uha.user_id = p_user_id
      WHERE ptv.template_id = pt.id
      AND (
        -- Correspondance directe : même entité
        (ptv.entity_type = uha.entity_type AND ptv.entity_id = uha.entity_id)
        OR
        -- Héritage : le modèle est affecté à un pôle, l'utilisateur est dans une direction de ce pôle
        (ptv.entity_type = 'pole' AND uha.entity_type = 'direction' AND EXISTS (
          SELECT 1 FROM directions d WHERE d.id = uha.entity_id AND d.pole_id = ptv.entity_id
        ))
        OR
        -- Héritage : le modèle est affecté à un pôle, l'utilisateur est dans un service d'une direction de ce pôle
        (ptv.entity_type = 'pole' AND uha.entity_type = 'service' AND EXISTS (
          SELECT 1 FROM services s
          JOIN directions d ON s.direction_id = d.id
          WHERE s.id = uha.entity_id AND d.pole_id = ptv.entity_id
        ))
        OR
        -- Héritage : le modèle est affecté à une direction, l'utilisateur est dans un service de cette direction
        (ptv.entity_type = 'direction' AND uha.entity_type = 'service' AND EXISTS (
          SELECT 1 FROM services s WHERE s.id = uha.entity_id AND s.direction_id = ptv.entity_id
        ))
      )
    )
  )
  ORDER BY pt.created_at DESC;
END;
$$;
