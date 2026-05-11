CREATE OR REPLACE FUNCTION public.get_accessible_project_managers(p_user_id uuid)
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
        RETURN QUERY
        SELECT p.id, p.email, p.first_name, p.last_name, p.created_at
        FROM profiles p
        JOIN user_roles ur ON ur.user_id = p.id
        WHERE ur.role = 'chef_projet'
          AND p.is_active IS NOT FALSE
        ORDER BY p.first_name, p.last_name;
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'manager') THEN
        RETURN QUERY
        WITH manager_accessible_paths AS (
            SELECT hp.path_string
            FROM manager_path_assignments mpa
            JOIN hierarchy_paths hp ON hp.id = mpa.path_id
            WHERE mpa.user_id = p_user_id
        ),
        accessible_entities AS (
            SELECT pl.id as entity_id, 'pole'::user_hierarchy_level as entity_type
            FROM poles pl
            JOIN hierarchy_paths hp ON hp.pole_id = pl.id
            JOIN manager_accessible_paths map ON hp.path_string LIKE map.path_string || '%' OR map.path_string LIKE hp.path_string || '%'
            UNION
            SELECT d.id, 'direction'::user_hierarchy_level
            FROM directions d
            JOIN hierarchy_paths hp ON hp.direction_id = d.id
            JOIN manager_accessible_paths map ON hp.path_string LIKE map.path_string || '%' OR map.path_string LIKE hp.path_string || '%'
            UNION
            SELECT s.id, 'service'::user_hierarchy_level
            FROM services s
            JOIN hierarchy_paths hp ON hp.service_id = s.id
            JOIN manager_accessible_paths map ON hp.path_string LIKE map.path_string || '%' OR map.path_string LIKE hp.path_string || '%'
        ),
        accessible_users AS (
            SELECT DISTINCT uha.user_id
            FROM user_hierarchy_assignments uha
            JOIN accessible_entities ae ON uha.entity_id = ae.entity_id AND uha.entity_type = ae.entity_type
            UNION
            SELECT p_user_id
            WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'chef_projet')
        )
        SELECT p.id, p.email, p.first_name, p.last_name, p.created_at
        FROM profiles p
        JOIN user_roles ur ON ur.user_id = p.id
        JOIN accessible_users au ON au.user_id = p.id
        WHERE ur.role = 'chef_projet'
          AND p.is_active IS NOT FALSE
        ORDER BY p.first_name, p.last_name;
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'chef_projet') THEN
        RETURN QUERY
        SELECT p.id, p.email, p.first_name, p.last_name, p.created_at
        FROM profiles p
        WHERE p.id = p_user_id;
        RETURN;
    END IF;

    RETURN;
END;
$function$;