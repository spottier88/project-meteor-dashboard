
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioProjectAccess } from "./usePortfolioProjectAccess";

export const useReviewAccess = (projectId?: string) => {
  const { isManager, userProfile } = usePermissionsContext();
  const { effectiveAdminStatus: isAdmin } = useAdminModeAwareData();
  
  // Vérifier l'accès via portefeuille
  const { hasAccessViaPortfolio } = usePortfolioProjectAccess(projectId || "");
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectReviewAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        isProjectManager: false,
        isSecondaryProjectManager: false,
        hasRegularAccess: false,
      };

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager, lifecycle_status")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      // Vérifier si l'utilisateur est un chef de projet secondaire
      const { data: projectMember } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const isSecondaryProjectManager = projectMember?.role === 'secondary_manager';
      
      const hasRegularAccess = isProjectManager || isSecondaryProjectManager;

      return {
        isProjectManager,
        isSecondaryProjectManager,
        hasRegularAccess,
        lifecycleStatus: project?.lifecycle_status,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });
  
  // Déterminer si l'utilisateur est en mode lecture seule via portefeuille
  const isReadOnlyViaPortfolio = hasAccessViaPortfolio && !projectAccess?.hasRegularAccess && !isAdmin;
  
  // Déterminer si le projet est clôturé
  const isProjectClosed = projectAccess?.lifecycleStatus === 'completed';
  
  // Seuls les admins et chefs de projet (principaux ou secondaires) peuvent créer des revues
  // Les managers n'ont plus ce droit - et pas en mode lecture seule via portefeuille
  // ET pas si le projet est clôturé
  const canCreateReview = (isReadOnlyViaPortfolio || isProjectClosed) ? false : (isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager);
  
  // Nouvelle propriété pour contrôler qui peut supprimer des revues
  // Les managers ne peuvent pas supprimer de revues - et pas en mode lecture seule via portefeuille
  // ET pas si le projet est clôturé
  const canDeleteReview = (isReadOnlyViaPortfolio || isProjectClosed) ? false : (isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager);

  return {
    canCreateReview,
    canDeleteReview,
    canViewReviews: true, // Tout le monde peut voir les revues s'ils ont accès au projet
    isProjectClosed,
    isReadOnlyViaPortfolio
  };
};

