
-- ============================================================================
-- Statistiques administrateur : fonctions RPC pour les pages
-- /admin/stats-content et /admin/stats-usage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Statistiques de contenu
--    Renvoie un JSON consolidé : projets, tâches, risques, revues,
--    organisation et utilisateurs.
--    Filtres optionnels : p_pole / p_direction / p_service.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_content_stats(
  p_pole uuid DEFAULT NULL,
  p_direction uuid DEFAULT NULL,
  p_service uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Sécurité : réservé aux administrateurs
  IF NOT public.has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Accès refusé : rôle administrateur requis';
  END IF;

  WITH filtered_projects AS (
    SELECT p.*
    FROM projects p
    WHERE (p_pole IS NULL OR p.pole_id = p_pole)
      AND (p_direction IS NULL OR p.direction_id = p_direction)
      AND (p_service IS NULL OR p.service_id = p_service)
  ),
  innovative_ids AS (
    SELECT DISTINCT project_id FROM project_innovation_scores
  ),
  project_kpis AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE lifecycle_status = 'in_progress') AS in_progress,
      COUNT(*) FILTER (WHERE lifecycle_status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE lifecycle_status = 'study') AS study,
      COUNT(*) FILTER (WHERE lifecycle_status = 'validated') AS validated,
      COUNT(*) FILTER (WHERE lifecycle_status = 'suspended') AS suspended,
      COUNT(*) FILTER (WHERE id IN (SELECT project_id FROM innovative_ids)) AS innovative
    FROM filtered_projects
  ),
  latest_reviews AS (
    SELECT DISTINCT ON (project_id) project_id, weather, completion, created_at
    FROM reviews
    ORDER BY project_id, created_at DESC
  ),
  weather_dist AS (
    SELECT
      COUNT(*) FILTER (WHERE lr.weather = 'sunny') AS sunny,
      COUNT(*) FILTER (WHERE lr.weather = 'cloudy') AS cloudy,
      COUNT(*) FILTER (WHERE lr.weather = 'stormy') AS stormy,
      COUNT(*) FILTER (WHERE lr.weather IS NULL) AS unknown,
      COALESCE(AVG(lr.completion), 0)::int AS avg_completion
    FROM filtered_projects fp
    LEFT JOIN latest_reviews lr ON lr.project_id = fp.id
  ),
  by_pole AS (
    SELECT pl.name, COUNT(fp.id) AS count
    FROM poles pl
    LEFT JOIN filtered_projects fp ON fp.pole_id = pl.id
    GROUP BY pl.name
    ORDER BY count DESC
  ),
  by_direction AS (
    SELECT d.name, COUNT(fp.id) AS count
    FROM directions d
    LEFT JOIN filtered_projects fp ON fp.direction_id = d.id
    GROUP BY d.name
    ORDER BY count DESC
    LIMIT 15
  ),
  missing_reviews AS (
    SELECT COUNT(*) AS count
    FROM filtered_projects fp
    WHERE fp.lifecycle_status = 'in_progress'
      AND (fp.last_review_date IS NULL OR fp.last_review_date < now() - interval '30 days')
  ),
  task_kpis AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE t.status = 'done') AS done,
      COUNT(*) FILTER (WHERE t.status != 'done' AND t.due_date < CURRENT_DATE) AS overdue
    FROM tasks t
    JOIN filtered_projects fp ON fp.id = t.project_id
  ),
  risk_kpis AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE r.status = 'open') AS open_count,
      COUNT(*) FILTER (WHERE r.status = 'open' AND r.probability = 'high' AND r.severity = 'high') AS critical
    FROM risks r
    JOIN filtered_projects fp ON fp.id = r.project_id
  ),
  review_kpis AS (
    SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT project_id) AS projects_reviewed
    FROM reviews r
    JOIN filtered_projects fp ON fp.id = r.project_id
  ),
  org_kpis AS (
    SELECT
      (SELECT COUNT(*) FROM poles) AS poles,
      (SELECT COUNT(*) FROM directions) AS directions,
      (SELECT COUNT(*) FROM services) AS services,
      (SELECT COUNT(*) FROM profiles WHERE is_active = true) AS active_users,
      (SELECT COUNT(*) FROM profiles WHERE is_active = false) AS inactive_users
  ),
  roles_dist AS (
    SELECT role::text AS role, COUNT(*) AS count
    FROM user_roles
    GROUP BY role
  ),
  top_pms AS (
    SELECT pr.email,
           COALESCE(pr.first_name || ' ' || pr.last_name, pr.email) AS name,
           COUNT(fp.id) AS count
    FROM filtered_projects fp
    JOIN profiles pr ON pr.email = fp.project_manager
    GROUP BY pr.email, pr.first_name, pr.last_name
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'projects', (SELECT to_jsonb(project_kpis) FROM project_kpis),
    'weather', (SELECT to_jsonb(weather_dist) FROM weather_dist),
    'by_pole', (SELECT COALESCE(jsonb_agg(to_jsonb(by_pole)), '[]'::jsonb) FROM by_pole),
    'by_direction', (SELECT COALESCE(jsonb_agg(to_jsonb(by_direction)), '[]'::jsonb) FROM by_direction),
    'missing_reviews', (SELECT count FROM missing_reviews),
    'tasks', (SELECT to_jsonb(task_kpis) FROM task_kpis),
    'risks', (SELECT to_jsonb(risk_kpis) FROM risk_kpis),
    'reviews', (SELECT to_jsonb(review_kpis) FROM review_kpis),
    'org', (SELECT to_jsonb(org_kpis) FROM org_kpis),
    'roles', (SELECT COALESCE(jsonb_agg(to_jsonb(roles_dist)), '[]'::jsonb) FROM roles_dist),
    'top_pms', (SELECT COALESCE(jsonb_agg(to_jsonb(top_pms)), '[]'::jsonb) FROM top_pms)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_content_stats(uuid, uuid, uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) Statistiques d'usage
--    Renvoie un JSON consolidé : DAU/WAU/MAU, séries temporelles,
--    top utilisateurs et projets actifs.
--    En l'absence d'accès aux auth_logs, on utilise les created_at/updated_at
--    des tables métier comme proxy d'activité (création de projets, revues,
--    tâches, notes, risques).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_usage_stats(
  p_start timestamptz,
  p_end timestamptz,
  p_pole uuid DEFAULT NULL,
  p_direction uuid DEFAULT NULL,
  p_service uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Accès refusé : rôle administrateur requis';
  END IF;

  WITH filtered_projects AS (
    SELECT p.id, p.title, p.pole_id, p.direction_id, p.service_id, p.project_manager
    FROM projects p
    WHERE (p_pole IS NULL OR p.pole_id = p_pole)
      AND (p_direction IS NULL OR p.direction_id = p_direction)
      AND (p_service IS NULL OR p.service_id = p_service)
  ),
  -- Construction de la table des événements (proxy d'activité)
  events AS (
    SELECT p.owner_id AS user_id, p.created_at AS ts, 'project_created' AS event_type, p.id AS project_id
    FROM projects p
    WHERE p.created_at BETWEEN p_start AND p_end
      AND p.id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT NULL::uuid AS user_id, r.created_at AS ts, 'review_created' AS event_type, r.project_id
    FROM reviews r
    WHERE r.created_at BETWEEN p_start AND p_end
      AND r.project_id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT NULL::uuid AS user_id, t.created_at AS ts, 'task_created' AS event_type, t.project_id
    FROM tasks t
    WHERE t.created_at BETWEEN p_start AND p_end
      AND t.project_id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT t.assignee::uuid AS user_id, t.updated_at AS ts, 'task_updated' AS event_type, t.project_id
    FROM tasks t
    WHERE t.updated_at BETWEEN p_start AND p_end
      AND t.updated_at <> t.created_at
      AND t.project_id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT pn.author_id AS user_id, pn.created_at AS ts, 'note_created' AS event_type, pn.project_id
    FROM project_notes pn
    WHERE pn.created_at BETWEEN p_start AND p_end
      AND pn.project_id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT NULL::uuid AS user_id, rk.created_at AS ts, 'risk_created' AS event_type, rk.project_id
    FROM risks rk
    WHERE rk.created_at BETWEEN p_start AND p_end
      AND rk.project_id IN (SELECT id FROM filtered_projects)
    UNION ALL
    SELECT a.user_id, a.created_at AS ts, 'activity_logged' AS event_type, a.project_id
    FROM activities a
    WHERE a.created_at BETWEEN p_start AND p_end
      AND (a.project_id IS NULL OR a.project_id IN (SELECT id FROM filtered_projects))
  ),
  -- KPIs : DAU / WAU / MAU
  active_kpis AS (
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM events WHERE user_id IS NOT NULL AND ts >= now() - interval '1 day') AS dau,
      (SELECT COUNT(DISTINCT user_id) FROM events WHERE user_id IS NOT NULL AND ts >= now() - interval '7 days') AS wau,
      (SELECT COUNT(DISTINCT user_id) FROM events WHERE user_id IS NOT NULL AND ts >= now() - interval '30 days') AS mau,
      (SELECT COUNT(*) FROM profiles WHERE is_active = true) AS total_active_accounts
  ),
  -- KPIs par type d'événement
  event_kpis AS (
    SELECT event_type, COUNT(*) AS count
    FROM events
    GROUP BY event_type
  ),
  -- Série temporelle : utilisateurs actifs distincts par jour
  daily_active AS (
    SELECT
      to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day,
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS active_users
    FROM events
    GROUP BY date_trunc('day', ts)
    ORDER BY date_trunc('day', ts)
  ),
  -- Série temporelle multi-séries : événements par jour et par type
  daily_events AS (
    SELECT
      to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day,
      event_type,
      COUNT(*) AS count
    FROM events
    GROUP BY date_trunc('day', ts), event_type
    ORDER BY date_trunc('day', ts)
  ),
  -- Top utilisateurs par nombre d'actions
  top_users AS (
    SELECT
      e.user_id,
      COALESCE(pr.first_name || ' ' || pr.last_name, pr.email, 'Inconnu') AS name,
      pr.email,
      COUNT(*) AS actions
    FROM events e
    LEFT JOIN profiles pr ON pr.id = e.user_id
    WHERE e.user_id IS NOT NULL
    GROUP BY e.user_id, pr.first_name, pr.last_name, pr.email
    ORDER BY actions DESC
    LIMIT 20
  ),
  -- Top projets les plus actifs
  top_projects AS (
    SELECT
      e.project_id,
      fp.title,
      COUNT(*) AS events
    FROM events e
    JOIN filtered_projects fp ON fp.id = e.project_id
    WHERE e.project_id IS NOT NULL
    GROUP BY e.project_id, fp.title
    ORDER BY events DESC
    LIMIT 10
  ),
  -- Comptes inactifs (jamais agi sur la période ou plus de 30 jours sans action)
  inactive_accounts AS (
    SELECT COUNT(*) AS count
    FROM profiles pr
    WHERE pr.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM events e WHERE e.user_id = pr.id AND e.ts >= now() - interval '30 days'
      )
  )
  SELECT jsonb_build_object(
    'active', (SELECT to_jsonb(active_kpis) FROM active_kpis),
    'events', (SELECT COALESCE(jsonb_object_agg(event_type, count), '{}'::jsonb) FROM event_kpis),
    'daily_active', (SELECT COALESCE(jsonb_agg(to_jsonb(daily_active)), '[]'::jsonb) FROM daily_active),
    'daily_events', (SELECT COALESCE(jsonb_agg(to_jsonb(daily_events)), '[]'::jsonb) FROM daily_events),
    'top_users', (SELECT COALESCE(jsonb_agg(to_jsonb(top_users)), '[]'::jsonb) FROM top_users),
    'top_projects', (SELECT COALESCE(jsonb_agg(to_jsonb(top_projects)), '[]'::jsonb) FROM top_projects),
    'inactive_accounts', (SELECT count FROM inactive_accounts)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_usage_stats(timestamptz, timestamptz, uuid, uuid, uuid) TO authenticated;
