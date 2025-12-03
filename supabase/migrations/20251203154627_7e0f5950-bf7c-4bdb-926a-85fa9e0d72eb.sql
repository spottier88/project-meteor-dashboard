
-- =============================================================================
-- MIGRATION: Unification du système de permissions managers vers manager_path_assignments
-- =============================================================================

-- 1. Mise à jour de la fonction get_accessible_projects_list_view
-- pour utiliser manager_path_assignments au lieu de manager_assignments
CREATE OR REPLACE FUNCTION public.get_accessible_projects_list_view(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    is_admin BOOLEAN;
    result JSONB;
BEGIN
    -- Vérifier si l'utilisateur est admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) INTO is_admin;

    -- Si l'utilisateur est admin, retourner tous les projets
    IF is_admin THEN
        SELECT get_projects_list_view() INTO result;
        RETURN result;
    END IF;

    -- Pour les autres utilisateurs, filtrer selon les permissions
    -- MODIFICATION: Utilisation de manager_path_assignments au lieu de manager_assignments
    SELECT jsonb_agg(proj)
    INTO result
    FROM (
        SELECT jsonb_array_elements(get_projects_list_view()) AS proj
    ) AS p
    WHERE (
        -- Est le chef de projet
        p.proj->>'project_manager_id' = p_user_id::text
        -- Ou est membre du projet
        OR EXISTS (
            SELECT 1 
            FROM project_members pm 
            WHERE pm.project_id = (p.proj->>'id')::uuid 
            AND pm.user_id = p_user_id
        )
        -- Ou est manager dans la hiérarchie du projet via manager_path_assignments
        OR EXISTS (
            SELECT 1 
            FROM manager_path_assignments mpa
            JOIN hierarchy_paths hp ON hp.id = mpa.path_id
            JOIN hierarchy_paths project_hp ON project_hp.id = (p.proj->>'path_id')::uuid
            WHERE mpa.user_id = p_user_id
            -- Le chemin du manager doit être un préfixe ou égal au chemin du projet
            AND project_hp.path_string LIKE hp.path_string || '%'
        )
        -- Ou est propriétaire du projet
        OR (p.proj->>'owner_id')::uuid = p_user_id
    );

    RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- 2. Mise à jour de la fonction get_accessible_projects_list_view_with_admin_mode
CREATE OR REPLACE FUNCTION public.get_accessible_projects_list_view_with_admin_mode(p_user_id uuid, p_admin_mode_disabled boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    is_admin BOOLEAN;
    effective_admin BOOLEAN;
    result JSONB;
BEGIN
    -- Vérifier si l'utilisateur est admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) INTO is_admin;

    -- Calculer le statut admin effectif
    effective_admin := is_admin AND NOT p_admin_mode_disabled;

    -- Si l'utilisateur est admin ET que le mode admin n'est pas désactivé, retourner tous les projets
    IF effective_admin THEN
        SELECT get_projects_list_view() INTO result;
        RETURN result;
    END IF;

    -- Pour les autres utilisateurs (ou admin avec mode désactivé), filtrer selon les permissions non-admin
    -- MODIFICATION: Utilisation de manager_path_assignments au lieu de manager_assignments
    SELECT jsonb_agg(proj)
    INTO result
    FROM (
        SELECT jsonb_array_elements(get_projects_list_view()) AS proj
    ) AS p
    WHERE (
        -- Est le chef de projet
        p.proj->>'project_manager_id' = p_user_id::text
        -- Ou est membre du projet
        OR EXISTS (
            SELECT 1 
            FROM project_members pm 
            WHERE pm.project_id = (p.proj->>'id')::uuid 
            AND pm.user_id = p_user_id
        )
        -- Ou est manager dans la hiérarchie du projet via manager_path_assignments
        OR EXISTS (
            SELECT 1 
            FROM manager_path_assignments mpa
            JOIN hierarchy_paths hp ON hp.id = mpa.path_id
            JOIN hierarchy_paths project_hp ON project_hp.id = (p.proj->>'path_id')::uuid
            WHERE mpa.user_id = p_user_id
            -- Le chemin du manager doit être un préfixe ou égal au chemin du projet
            AND project_hp.path_string LIKE hp.path_string || '%'
        )
        -- Ou est propriétaire du projet
        OR (p.proj->>'owner_id')::uuid = p_user_id
    );

    RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- 3. Mise à jour de la fonction get_accessible_projects pour la cohérence
CREATE OR REPLACE FUNCTION public.get_accessible_projects(p_user_id uuid)
 RETURNS TABLE(id uuid, title text, status project_status, progress progress_status, last_review_date timestamp with time zone, project_manager text, owner_id uuid, pole_id uuid, direction_id uuid, service_id uuid, lifecycle_status project_lifecycle_status, completion integer, suivi_dgs boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Vérifier si l'utilisateur est admin
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        -- Retourner tous les projets pour les admins
        RETURN QUERY 
        SELECT 
            p.id, p.title, p.status, p.progress, p.last_review_date,
            p.project_manager, p.owner_id, p.pole_id, p.direction_id,
            p.service_id, p.lifecycle_status,
            COALESCE(lr.completion, 0) as completion,
            p.suivi_dgs
        FROM projects p
        LEFT JOIN latest_reviews lr ON lr.project_id = p.id;
        RETURN;
    END IF;

    -- Pour les autres utilisateurs, retourner les projets accessibles
    -- MODIFICATION: Utilisation de manager_path_assignments au lieu de manager_assignments
    RETURN QUERY 
    SELECT DISTINCT
        p.id, p.title, p.status, p.progress, p.last_review_date,
        p.project_manager, p.owner_id, p.pole_id, p.direction_id,
        p.service_id, p.lifecycle_status,
        COALESCE(lr.completion, 0) as completion,
        p.suivi_dgs
    FROM projects p
    LEFT JOIN latest_reviews lr ON lr.project_id = p.id
    LEFT JOIN project_members pm ON pm.project_id = p.id
    LEFT JOIN profiles prf ON prf.id = p_user_id
    LEFT JOIN hierarchy_paths project_hp ON project_hp.id = p.path_id
    WHERE 
        p.owner_id = p_user_id
        OR p.project_manager = prf.email
        OR pm.user_id = p_user_id
        -- Manager via hierarchy_paths
        OR EXISTS (
            SELECT 1 
            FROM manager_path_assignments mpa
            JOIN hierarchy_paths hp ON hp.id = mpa.path_id
            WHERE mpa.user_id = p_user_id
            AND project_hp.path_string LIKE hp.path_string || '%'
        );
END;
$function$;
