
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioProjectAccess } from "./usePortfolioProjectAccess";

export const useTaskPermissions = (projectId?: string, taskAssignee?: string) => {
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
        isMember: false,
        hasRegularAccess: false,
      };

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      if (isAdmin || isProjectManager) {
        return {
          canEdit: true,
          isProjectManager,
          isSecondaryProjectManager: false,
          isMember: true,
          hasRegularAccess: true,
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

      // Vérifier l'accès via la fonction can_manager_access_project
      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });
      
      // Vérifier si l'utilisateur est membre du projet
      const { data: isMember } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const hasRegularAccess = !!canAccess || isSecondaryProjectManager || !!isMember;

      return {
        canEdit: !!canAccess || isSecondaryProjectManager,
        isProjectManager,
        isSecondaryProjectManager,
        isMember: !!isMember,
        hasRegularAccess,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });

  // Déterminer si l'utilisateur est en mode lecture seule via portefeuille
  const isReadOnlyViaPortfolio = hasAccessViaPortfolio && !projectAccess?.hasRegularAccess && !isAdmin;

  // Un utilisateur peut gérer les tâches seulement s'il est admin, s'il a des droits d'édition spécifiques
  // sur ce projet ou s'il est chef de projet secondaire - et s'il n'est pas en lecture seule via portefeuille
  const canManage = isReadOnlyViaPortfolio ? false : (isAdmin || projectAccess?.canEdit || projectAccess?.isSecondaryProjectManager || false);
  
  return {
    canCreateTask: canManage,
    canEditTask: (assignee?: string) => isReadOnlyViaPortfolio ? false : (canManage || assignee === userProfile?.email),
    canDeleteTask: canManage,
    isAdmin,
    isProjectManager: projectAccess?.isProjectManager || false,
    isSecondaryProjectManager: projectAccess?.isSecondaryProjectManager || false,
    isMember: projectAccess?.isMember || false,
    isReadOnlyViaPortfolio,
    userEmail: userProfile?.email,
  };
};

