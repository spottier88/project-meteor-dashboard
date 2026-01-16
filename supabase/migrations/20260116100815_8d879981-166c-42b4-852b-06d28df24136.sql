-- Mise à jour de la fonction get_detailed_projects pour inclure les chefs de projet secondaires
CREATE OR REPLACE FUNCTION public.get_detailed_projects(p_project_ids uuid[])
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
    review_actions JSONB;
    framing_data JSONB;
    innovation_data JSONB;
    risks_data JSONB;
    tasks_data JSONB;
    code_data TEXT;
    pole_name TEXT;
    direction_name TEXT;
    service_name TEXT;
    project_manager_name TEXT;
    for_entity_name TEXT;
    secondary_managers_data JSONB;
BEGIN
    -- Vérifier si le tableau d'IDs est vide
    IF p_project_ids IS NULL OR array_length(p_project_ids, 1) IS NULL THEN
        RETURN result;
    END IF;

    -- Parcourir chaque projet
    FOR project_rec IN 
        SELECT * FROM projects 
        WHERE id = ANY(p_project_ids)
    LOOP
        -- Récupérer la dernière revue (avec difficulties)
        SELECT 
            jsonb_build_object(
                'weather', lr.weather,
                'progress', lr.progress,
                'completion', lr.completion,
                'comment', lr.comment,
                'difficulties', lr.difficulties,
                'created_at', lr.created_at,
                'review_id', lr.review_id
            ) INTO review_data
        FROM latest_reviews lr
        WHERE lr.project_id = project_rec.id;
        
        -- Récupérer les actions de la revue
        IF review_data IS NOT NULL AND review_data->>'review_id' IS NOT NULL THEN
            SELECT 
                COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', ra.id,
                        'description', ra.description
                    )
                ), '[]'::JSONB) INTO review_actions
            FROM review_actions ra
            WHERE ra.review_id = (review_data->>'review_id')::UUID;
        ELSE
            review_actions = '[]'::JSONB;
        END IF;
        
        -- Récupérer les informations de cadrage
        SELECT 
            jsonb_build_object(
                'context', pf.context,
                'objectives', pf.objectives,
                'governance', pf.governance,
                'deliverables', pf.deliverables,
                'stakeholders', pf.stakeholders,
                'timeline', pf.timeline
            ) INTO framing_data
        FROM project_framing pf
        WHERE pf.project_id = project_rec.id;
        
        -- Récupérer les scores d'innovation
        SELECT 
            jsonb_build_object(
                'novateur', pis.novateur,
                'usager', pis.usager,
                'ouverture', pis.ouverture,
                'agilite', pis.agilite,
                'impact', pis.impact
            ) INTO innovation_data
        FROM project_innovation_scores pis
        WHERE pis.project_id = project_rec.id;
        
        -- Récupérer les risques
        SELECT 
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'description', r.description,
                    'probability', r.probability,
                    'severity', r.severity,
                    'status', r.status,
                    'mitigation_plan', r.mitigation_plan
                )
            ), '[]'::JSONB) INTO risks_data
        FROM risks r
        WHERE r.project_id = project_rec.id;
        
        -- Récupérer les tâches
        SELECT 
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'title', t.title,
                    'description', t.description,
                    'status', t.status,
                    'start_date', t.start_date,
                    'due_date', t.due_date,
                    'assignee', t.assignee,
                    'parent_task_id', t.parent_task_id
                )
            ), '[]'::JSONB) INTO tasks_data
        FROM tasks t
        WHERE t.project_id = project_rec.id;
        
        -- Récupérer le code du projet
        SELECT pc.code INTO code_data
        FROM project_codes pc
        WHERE pc.project_id = project_rec.id;
        
        -- Récupérer les noms des entités (pôle, direction, service)
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
        
        -- Récupérer le nom de l'entité "Pour qui"
        IF project_rec.for_entity_type IS NOT NULL AND project_rec.for_entity_id IS NOT NULL THEN
            CASE project_rec.for_entity_type
                WHEN 'pole' THEN
                    SELECT name INTO for_entity_name
                    FROM poles
                    WHERE id = project_rec.for_entity_id;
                WHEN 'direction' THEN
                    SELECT name INTO for_entity_name
                    FROM directions
                    WHERE id = project_rec.for_entity_id;
                WHEN 'service' THEN
                    SELECT name INTO for_entity_name
                    FROM services
                    WHERE id = project_rec.for_entity_id;
            END CASE;
        END IF;
        
        -- Récupérer les chefs de projet secondaires
        SELECT 
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pm.user_id,
                    'name', TRIM(CONCAT(p.first_name, ' ', p.last_name))
                )
            ), '[]'::JSONB) INTO secondary_managers_data
        FROM project_members pm
        JOIN profiles p ON pm.user_id = p.id
        WHERE pm.project_id = project_rec.id AND pm.role = 'secondary_manager';
        
        -- Construire l'objet JSON du projet
        project_json = jsonb_build_object(
            'project', jsonb_build_object(
                'id', project_rec.id,
                'title', project_rec.title,
                'description', project_rec.description,
                'status', project_rec.status,
                'progress', project_rec.progress,
                'last_review_date', project_rec.last_review_date,
                'project_manager', project_rec.project_manager,
                'project_manager_name', project_manager_name,
                'secondary_managers', secondary_managers_data,
                'owner_id', project_rec.owner_id,
                'pole_id', project_rec.pole_id,
                'direction_id', project_rec.direction_id,
                'service_id', project_rec.service_id,
                'lifecycle_status', project_rec.lifecycle_status,
                'start_date', project_rec.start_date,
                'end_date', project_rec.end_date,
                'pole_name', pole_name,
                'direction_name', direction_name,
                'service_name', service_name,
                'code', code_data,
                'for_entity_type', project_rec.for_entity_type,
                'for_entity_id', project_rec.for_entity_id,
                'for_entity_name', for_entity_name,
                'suivi_dgs', project_rec.suivi_dgs,
                'priority', project_rec.priority,
                'completion', COALESCE((review_data->>'completion')::INTEGER, 0),
                'weather', COALESCE(review_data->>'weather', NULL)
            ),
            'lastReview', CASE 
                WHEN review_data IS NULL THEN NULL
                ELSE jsonb_build_object(
                    'weather', review_data->>'weather',
                    'progress', review_data->>'progress',
                    'completion', (review_data->>'completion')::INTEGER,
                    'comment', review_data->>'comment',
                    'difficulties', review_data->>'difficulties',
                    'created_at', review_data->>'created_at',
                    'actions', review_actions
                )
            END,
            'framing', framing_data,
            'innovation', innovation_data,
            'risks', risks_data,
            'tasks', tasks_data
        );
        
        -- Ajouter le projet au résultat
        result = result || project_json;
    END LOOP;
    
    RETURN result;
END;
$function$;