
-- =============================================================================
-- MIGRATION: Mise à jour de can_manager_access_projects pour utiliser manager_path_assignments
-- =============================================================================

CREATE OR REPLACE FUNCTION public.can_manager_access_projects(p_user_id uuid, p_project_ids uuid[])
 RETURNS TABLE(project_id uuid, can_access boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Vérifier si l'utilisateur est un manager
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'manager'
    ) THEN
        -- Si pas manager, retourner false pour tous les projets
        RETURN QUERY 
        SELECT 
            unnest(p_project_ids) as project_id,
            false as can_access;
        RETURN;
    END IF;

    -- Utilise manager_path_assignments au lieu de manager_assignments
    RETURN QUERY
    WITH project_hierarchies AS (
        -- Obtenir les chemins des projets
        SELECT 
            p.id as project_id,
            hp.path_string 
        FROM unnest(p_project_ids) pid
        JOIN projects p ON p.id = pid
        LEFT JOIN hierarchy_paths hp ON p.path_id = hp.id
    ),
    manager_paths AS (
        -- Obtenir tous les chemins auxquels le manager a accès via manager_path_assignments
        SELECT hp.path_string
        FROM manager_path_assignments mpa
        JOIN hierarchy_paths hp ON mpa.path_id = hp.id
        WHERE mpa.user_id = p_user_id
    )
    SELECT 
        ph.project_id,
        -- Le manager a accès si le chemin du projet commence par l'un de ses chemins assignés
        EXISTS (
            SELECT 1 
            FROM manager_paths mp 
            WHERE ph.path_string IS NOT NULL 
            AND ph.path_string LIKE mp.path_string || '%'
        ) as can_access
    FROM project_hierarchies ph;
END;
$function$;
