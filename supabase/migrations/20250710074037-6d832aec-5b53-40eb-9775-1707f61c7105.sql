
-- Fonction pour vérifier si un utilisateur peut assigner un projet à un portefeuille
CREATE OR REPLACE FUNCTION public.can_assign_to_portfolio(p_user_id uuid, p_portfolio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Admin a tous les droits
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id 
        AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Vérifier si l'utilisateur peut gérer ce portefeuille
    RETURN EXISTS (
        SELECT 1 FROM portfolio_managers pm
        WHERE pm.portfolio_id = p_portfolio_id
        AND pm.user_id = p_user_id
        AND pm.role IN ('manager', 'owner')
    );
END;
$$;

-- Fonction pour mettre à jour les statistiques d'un portefeuille
CREATE OR REPLACE FUNCTION public.update_portfolio_stats(p_portfolio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_total_projects integer;
    v_completed_projects integer;
    v_total_budget numeric;
BEGIN
    -- Compter les projets du portefeuille
    SELECT COUNT(*) INTO v_total_projects
    FROM projects
    WHERE portfolio_id = p_portfolio_id;

    -- Compter les projets terminés
    SELECT COUNT(*) INTO v_completed_projects
    FROM projects
    WHERE portfolio_id = p_portfolio_id
    AND lifecycle_status = 'completed';

    -- Calculer le budget total (si des budgets sont définis sur les projets)
    -- Note: Vous pourrez ajouter une colonne budget sur projects si nécessaire
    v_total_budget := 0;

    -- Mettre à jour le portefeuille avec les statistiques
    -- Note: Ces colonnes pourraient être ajoutées à project_portfolios si nécessaire
    -- pour l'instant, nous les calculons à la volée dans les requêtes
END;
$$;

-- Trigger pour mettre à jour les statistiques du portefeuille quand un projet change
CREATE OR REPLACE FUNCTION public.sync_portfolio_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si un projet est ajouté/modifié avec un portfolio_id
    IF NEW.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(NEW.portfolio_id);
    END IF;
    
    -- Si un projet avait un ancien portfolio_id différent (mise à jour)
    IF TG_OP = 'UPDATE' AND OLD.portfolio_id IS NOT NULL AND OLD.portfolio_id != COALESCE(NEW.portfolio_id, uuid_nil()) THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
    END IF;
    
    -- Si un projet est supprimé avec un portfolio_id
    IF TG_OP = 'DELETE' AND OLD.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table projects
DROP TRIGGER IF EXISTS sync_portfolio_stats_trigger ON projects;
CREATE TRIGGER sync_portfolio_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION sync_portfolio_stats();
