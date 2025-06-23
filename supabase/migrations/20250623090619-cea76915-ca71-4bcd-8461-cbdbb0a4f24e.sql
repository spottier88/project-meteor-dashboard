
-- Fonction pour récupérer les projets pour lesquels un utilisateur peut créer des revues
CREATE OR REPLACE FUNCTION public.get_reviewable_projects(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    title text,
    project_manager text,
    status project_status,
    weather project_status,
    last_review_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
            p.id,
            p.title,
            p.project_manager,
            p.status,
            p.status as weather, -- Utiliser status comme weather pour compatibilité
            p.last_review_date
        FROM projects p
        ORDER BY p.title;
        RETURN;
    END IF;

    -- Pour les autres utilisateurs, retourner uniquement les projets qu'ils peuvent manager
    -- (chef de projet principal ou secondaire)
    RETURN QUERY 
    SELECT DISTINCT
        p.id,
        p.title,
        p.project_manager,
        p.status,
        p.status as weather,
        p.last_review_date
    FROM projects p
    LEFT JOIN profiles pr ON pr.id = p_user_id
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = p_user_id
    WHERE 
        -- Est le chef de projet principal
        p.project_manager = pr.email
        OR 
        -- Est chef de projet secondaire
        (pm.role = 'secondary_manager')
    ORDER BY p.title;
END;
$$;
