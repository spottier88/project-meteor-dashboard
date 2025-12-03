-- Mise à jour de get_projects_list_view pour inclure path_id et project_manager_id
CREATE OR REPLACE FUNCTION public.get_projects_list_view()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB = '[]'::JSONB;
    project_rec RECORD;
    project_json JSONB;
    review_data JSONB;
    pole_name TEXT;
    direction_name TEXT;
    service_name TEXT;
    project_manager_name TEXT;
BEGIN
    -- Parcourir chaque projet
    FOR project_rec IN 
        SELECT 
            p.*,
            pm.monitoring_level,
            pm.monitoring_entity_id
        FROM projects p
        LEFT JOIN project_monitoring pm ON p.id = pm.project_id
        ORDER BY p.created_at DESC
    LOOP
        -- Récupérer la dernière revue (uniquement les infos essentielles)
        SELECT 
            jsonb_build_object(
                'weather', lr.weather,
                'progress', lr.progress,
                'completion', lr.completion,
                'created_at', lr.created_at
            ) INTO review_data
        FROM latest_reviews lr
        WHERE lr.project_id = project_rec.id;
        
        -- Récupérer les noms des entités (pôle, direction, service)
        pole_name := NULL;
        direction_name := NULL;
        service_name := NULL;
        project_manager_name := NULL;
        
        IF project_rec.pole_id IS NOT NULL THEN
            SELECT name INTO pole_name
            FROM poles
            WHERE id = project_rec.pole_id;
        END IF;
        
        IF project_rec.direction_id IS NOT NULL THEN
            SELECT name INTO direction_name
            FROM directions
            WHERE id = project_rec.direction_id;
        END IF;
        
        IF project_rec.service_id IS NOT NULL THEN
            SELECT name INTO service_name
            FROM services
            WHERE id = project_rec.service_id;
        END IF;
        
        -- Récupérer le nom du chef de projet
        IF project_rec.project_manager_id IS NOT NULL THEN
            SELECT 
                TRIM(CONCAT(p.first_name, ' ', p.last_name))
            INTO project_manager_name
            FROM profiles p
            WHERE p.id = project_rec.project_manager_id;
        END IF;
        
        -- Construire l'objet JSON du projet avec path_id et project_manager_id
        project_json = jsonb_build_object(
            'id', project_rec.id,
            'title', project_rec.title,
            'description', project_rec.description,
            'status', project_rec.status,
            'progress', project_rec.progress,
            'last_review_date', project_rec.last_review_date,
            'project_manager', project_rec.project_manager,
            'project_manager_id', project_rec.project_manager_id,
            'project_manager_name', project_manager_name,
            'owner_id', project_rec.owner_id,
            'pole_id', project_rec.pole_id,
            'direction_id', project_rec.direction_id,
            'service_id', project_rec.service_id,
            'path_id', project_rec.path_id,
            'lifecycle_status', project_rec.lifecycle_status,
            'start_date', project_rec.start_date,
            'end_date', project_rec.end_date,
            'pole_name', pole_name,
            'direction_name', direction_name,
            'service_name', service_name,
            'for_entity_type', project_rec.for_entity_type,
            'for_entity_id', project_rec.for_entity_id,
            'suivi_dgs', project_rec.suivi_dgs,
            'priority', project_rec.priority,
            'monitoring_level', project_rec.monitoring_level,
            'monitoring_entity_id', project_rec.monitoring_entity_id,
            'completion', COALESCE((review_data->>'completion')::INTEGER, 0),
            'weather', COALESCE(review_data->>'weather', NULL),
            'review_created_at', review_data->>'created_at',
            'review_progress', review_data->>'progress'
        );
        
        -- Ajouter le projet au résultat
        result = result || project_json;
    END LOOP;
    
    RETURN result;
END;
$function$;