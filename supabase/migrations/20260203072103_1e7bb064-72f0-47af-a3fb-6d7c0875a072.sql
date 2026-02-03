-- Créer la fonction has_role si elle n'existe pas
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = p_role
  )
$$;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;

-- Créer la fonction is_quality_manager
CREATE OR REPLACE FUNCTION public.is_quality_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'quality_manager'
  )
$$;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.is_quality_manager(uuid) TO authenticated;

-- Supprimer les anciennes politiques sur project_evaluations si elles existent
DROP POLICY IF EXISTS "Project owners and admins can view evaluations" ON public.project_evaluations;
DROP POLICY IF EXISTS "Users can view their project evaluations" ON public.project_evaluations;
DROP POLICY IF EXISTS "quality_managers_can_read_all_evaluations" ON public.project_evaluations;
DROP POLICY IF EXISTS "evaluation_read_policy" ON public.project_evaluations;

-- Créer une politique de lecture étendue pour les évaluations
-- Accessible par : admin, quality_manager, ou propriétaire/chef du projet
CREATE POLICY "evaluation_read_policy"
ON public.project_evaluations
FOR SELECT
TO authenticated
USING (
  -- Admins peuvent tout voir
  public.has_role(auth.uid(), 'admin'::public.user_role)
  -- Quality managers peuvent tout voir
  OR public.is_quality_manager(auth.uid())
  -- Le propriétaire du projet peut voir l'évaluation de son projet
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR p.project_manager = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  )
);