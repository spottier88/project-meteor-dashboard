
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectPermissions = (projectId: string) => {
  const { userProfile, isAdmin } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
        isProjectManager: false,
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
        };
      }

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      return {
        canEdit: !!canAccess,
        isProjectManager,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userProfile.id);
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  const isProjectManager = userRoles?.some(ur => ur.role === 'chef_projet') || false;

  return {
    canManageRisks: isAdmin || projectAccess?.canEdit || false,
    canEdit: projectAccess?.canEdit || false,
    canCreate: isAdmin || isProjectManager,
    canManageTeam: isAdmin || projectAccess?.isProjectManager || false,
    isAdmin,
    isProjectManager: projectAccess?.isProjectManager || false,
    userEmail: userProfile?.email,
  };
};
