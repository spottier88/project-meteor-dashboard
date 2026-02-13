
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioProjectAccess } from "./usePortfolioProjectAccess";

export const useRiskAccess = (projectId?: string) => {
  const { userProfile } = usePermissionsContext();
  const { effectiveAdminStatus: isAdmin } = useAdminModeAwareData();
  
  // Vérifier l'accès via portefeuille
  const { hasAccessViaPortfolio } = usePortfolioProjectAccess(projectId || "");
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
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

      if (isAdmin || isProjectManager) {
        return {
          canEdit: true,
          isProjectManager,
          isSecondaryProjectManager: false,
          hasRegularAccess: true,
          lifecycleStatus: project?.lifecycle_status,
        };
      }

      // Vérifier si l'utilisateur est un chef de projet secondaire
      const { data: projectMember } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const isSecondaryProjectManager = projectMember?.role === 'secondary_manager';

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      const hasRegularAccess = !!canAccess || isSecondaryProjectManager;

      return {
        canEdit: !!canAccess,
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

  // Les chefs de projet secondaires peuvent aussi gérer les risques - sauf en mode lecture seule via portefeuille
  // ET si le projet n'est pas clôturé
  const canManage = (isReadOnlyViaPortfolio || isProjectClosed) ? false : (isAdmin || projectAccess?.canEdit || projectAccess?.isSecondaryProjectManager || false);
  
  return {
    canCreateRisk: canManage,
    canEditRisk: canManage,
    canDeleteRisk: canManage,
    canViewRisks: true, // Tout le monde peut voir les risques s'ils ont accès au projet
    isProjectClosed,
    isReadOnlyViaPortfolio
  };
};

