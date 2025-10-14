-- Créer une vue pour agréger la dernière activité de chaque utilisateur
CREATE OR REPLACE VIEW user_last_activity AS
WITH user_activities AS (
  -- Dernière création de projet (en tant que chef de projet)
  SELECT 
    p.project_manager_id as user_id,
    MAX(p.created_at) as last_activity
  FROM projects p
  WHERE p.project_manager_id IS NOT NULL
  GROUP BY p.project_manager_id

  UNION ALL

  -- Dernière création d'activité
  SELECT 
    a.user_id,
    MAX(a.created_at) as last_activity
  FROM activities a
  GROUP BY a.user_id

  UNION ALL

  -- Dernière création de revue (via le projet dont ils sont manager)
  SELECT 
    p.project_manager_id as user_id,
    MAX(r.created_at) as last_activity
  FROM reviews r
  JOIN projects p ON p.id = r.project_id
  WHERE p.project_manager_id IS NOT NULL
  GROUP BY p.project_manager_id

  UNION ALL

  -- Dernière modification de tâche (en tant qu'assigné)
  SELECT 
    pr.id as user_id,
    MAX(t.updated_at) as last_activity
  FROM tasks t
  JOIN profiles pr ON pr.email = t.assignee
  WHERE t.assignee IS NOT NULL
  GROUP BY pr.id

  UNION ALL

  -- Dernière modification de risque (via le projet dont ils sont manager)
  SELECT 
    p.project_manager_id as user_id,
    MAX(ri.updated_at) as last_activity
  FROM risks ri
  JOIN projects p ON p.id = ri.project_id
  WHERE p.project_manager_id IS NOT NULL
  GROUP BY p.project_manager_id

  UNION ALL

  -- Dernière saisie de points d'activité
  SELECT 
    ap.user_id,
    MAX(ap.created_at) as last_activity
  FROM activity_points ap
  GROUP BY ap.user_id

  UNION ALL

  -- Dernière création de portefeuille
  SELECT 
    pp.created_by as user_id,
    MAX(pp.updated_at) as last_activity
  FROM project_portfolios pp
  GROUP BY pp.created_by

  UNION ALL

  -- Dernière modification de cadrage de projet
  SELECT 
    p.project_manager_id as user_id,
    MAX(pf.updated_at) as last_activity
  FROM project_framing pf
  JOIN projects p ON p.id = pf.project_id
  WHERE p.project_manager_id IS NOT NULL
  GROUP BY p.project_manager_id
)
SELECT 
  user_id,
  MAX(last_activity) as last_activity_at
FROM user_activities
GROUP BY user_id;

-- Créer une fonction RPC sécurisée pour récupérer la dernière activité des utilisateurs
CREATE OR REPLACE FUNCTION get_users_last_activity()
RETURNS TABLE(user_id uuid, last_activity_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ula.user_id,
    ula.last_activity_at
  FROM user_last_activity ula
  WHERE EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  );
$$;