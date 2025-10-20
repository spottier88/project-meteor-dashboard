-- Table pour stocker les liens entre projets
CREATE TABLE project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    linked_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES profiles(id),
    
    -- Un projet ne peut être lié qu'à un seul projet maître
    UNIQUE(linked_project_id),
    
    -- Un projet ne peut pas être lié à lui-même
    CHECK (master_project_id != linked_project_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_project_links_master ON project_links(master_project_id);
CREATE INDEX idx_project_links_linked ON project_links(linked_project_id);

-- Activer RLS
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent tout faire
CREATE POLICY "Admins can manage project links"
ON project_links
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Politique : Les utilisateurs peuvent voir les liens des projets auxquels ils ont accès
CREATE POLICY "Users can view project links for accessible projects"
ON project_links
FOR SELECT
TO authenticated
USING (
    can_access_project(auth.uid(), master_project_id)
    OR can_access_project(auth.uid(), linked_project_id)
);

-- Fonction pour récupérer tous les projets liés à un projet maître
CREATE OR REPLACE FUNCTION get_linked_projects(p_master_project_id UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    status project_status,
    lifecycle_status project_lifecycle_status,
    project_manager TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.status,
        p.lifecycle_status,
        p.project_manager,
        p.created_at
    FROM projects p
    JOIN project_links pl ON p.id = pl.linked_project_id
    WHERE pl.master_project_id = p_master_project_id;
END;
$$;

-- Fonction pour récupérer le projet maître d'un projet lié
CREATE OR REPLACE FUNCTION get_master_project(p_linked_project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    master_id UUID;
BEGIN
    SELECT master_project_id INTO master_id
    FROM project_links
    WHERE linked_project_id = p_linked_project_id;
    
    RETURN master_id;
END;
$$;

-- Fonction pour vérifier si un projet est un projet lié
CREATE OR REPLACE FUNCTION is_project_linked(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_links
        WHERE linked_project_id = p_project_id
    );
END;
$$;