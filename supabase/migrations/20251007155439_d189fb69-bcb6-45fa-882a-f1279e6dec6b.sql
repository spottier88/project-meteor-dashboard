-- Phase 2 : Création de la table activity_points et fonction de calcul

-- Création de la table activity_points
CREATE TABLE IF NOT EXISTS public.activity_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_type TEXT,
    points INTEGER NOT NULL CHECK (points > 0),
    week_start_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_activity_points_user_week 
    ON public.activity_points(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_activity_points_project 
    ON public.activity_points(project_id);

-- Activer RLS sur la table
ALTER TABLE public.activity_points ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres points
CREATE POLICY "Users can view their own activity points"
    ON public.activity_points
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres points
CREATE POLICY "Users can insert their own activity points"
    ON public.activity_points
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres points
CREATE POLICY "Users can update their own activity points"
    ON public.activity_points
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres points
CREATE POLICY "Users can delete their own activity points"
    ON public.activity_points
    FOR DELETE
    USING (auth.uid() = user_id);

-- Politique : Les managers peuvent voir les points des projets qu'ils gèrent
CREATE POLICY "Managers can view team activity points"
    ON public.activity_points
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = activity_points.project_id
            AND (
                p.project_manager = (SELECT email FROM profiles WHERE id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM manager_assignments ma
                    WHERE ma.user_id = auth.uid()
                    AND (
                        (ma.entity_type = 'pole' AND p.pole_id = ma.entity_id)
                        OR (ma.entity_type = 'direction' AND p.direction_id = ma.entity_id)
                        OR (ma.entity_type = 'service' AND p.service_id = ma.entity_id)
                    )
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_activity_points_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_activity_points_updated_at
    BEFORE UPDATE ON public.activity_points
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_points_updated_at();

-- Fonction pour calculer le total des points utilisés par un utilisateur sur une semaine
CREATE OR REPLACE FUNCTION public.get_user_weekly_points_total(
    p_user_id UUID,
    p_week_start DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0)
    INTO total_points
    FROM activity_points
    WHERE user_id = p_user_id
    AND week_start_date = p_week_start;
    
    RETURN total_points;
END;
$$;