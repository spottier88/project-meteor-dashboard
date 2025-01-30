import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

let hookCallCount = 0;

export const useProjectAccess = (projectId: string) => {
  hookCallCount++;
  const { userProfile, isAdmin, userRoles } = usePermissionsContext();

  console.log(`[useProjectAccess] Hook called ${hookCallCount} times`, {
    projectId,
    userId: userProfile?.id,
    userEmail: userProfile?.email,
    isAdmin,
    userRoles,
    timestamp: new Date().toISOString()
  });

  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) {
        console.log("[useProjectAccess] Missing user ID or project ID");
        return {
          canAccess: false,
          canManage: false,
          canEdit: false,
          userRoles
        };
      }

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      if (isAdmin || isProjectManager) {
        console.log("[useProjectAccess] User is admin or project manager");
        return {
          canAccess: true,
          canManage: true,
          canEdit: true,
          userRoles
        };
      }

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      console.log("[useProjectAccess] Access check result:", {
        canAccess,
        isProjectManager,
        isAdmin
      });

      return {
        canAccess: !!canAccess,
        canManage: !!canAccess,
        canEdit: !!canAccess,
        userRoles
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });

  return projectAccess || {
    canAccess: false,
    canManage: false,
    canEdit: false,
    userRoles
  };
};