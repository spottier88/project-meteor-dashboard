-- Créer une nouvelle fonction RPC qui prend en compte le mode admin désactivé
CREATE OR REPLACE FUNCTION public.get_accessible_projects_list_view_with_admin_mode(
    p_user_id uuid,
    p_admin_mode_disabled boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
        -- Ou est manager dans la hiérarchie du projet
        OR EXISTS (
            SELECT 1 
            FROM manager_assignments ma
            WHERE ma.user_id = p_user_id
            AND (
                (ma.entity_type = 'pole' AND (p.proj->>'pole_id')::uuid = ma.entity_id)
                OR (ma.entity_type = 'direction' AND (p.proj->>'direction_id')::uuid = ma.entity_id)
                OR (ma.entity_type = 'service' AND (p.proj->>'service_id')::uuid = ma.entity_id)
            )
        )
        -- Ou est propriétaire du projet
        OR (p.proj->>'owner_id')::uuid = p_user_id
    );

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;