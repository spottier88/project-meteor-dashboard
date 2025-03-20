
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRiskAccess = (projectId: string) => {
  const { isAdmin, userProfile } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
        isProjectManager: false,
        isSecondaryProjectManager: false,
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

      return {
        canEdit: !!canAccess,
        isProjectManager,
        isSecondaryProjectManager,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });

  const canManage = isAdmin || projectAccess?.canEdit || projectAccess?.isSecondaryProjectManager || false;
  
  return {
    canCreateRisk: canManage,
    canEditRisk: canManage,
    canDeleteRisk: canManage,
    canViewRisks: true // Tout le monde peut voir les risques s'ils ont accès au projet
  };
};
