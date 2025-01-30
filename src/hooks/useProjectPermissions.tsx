import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

let hookCallCount = 0;

interface ProjectPermissions {
  canEdit: boolean;
  canManageTeam: boolean;
  canDelete: boolean;
  isMember: boolean;
  isProjectManager: boolean;
}

export const useProjectPermissions = (projectId: string): ProjectPermissions => {
  hookCallCount++;
  const { userProfile, isAdmin, isManager } = usePermissionsContext();
  
  console.log(`[useProjectPermissions] Hook called ${hookCallCount} times`, {
    projectId,
    userEmail: userProfile?.email,
    isAdmin,
    isManager
  });
  
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        console.log("[useProjectPermissions] No project ID provided");
        return null;
      }
      
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("[useProjectPermissions] Error fetching project:", error);
        return null;
      }

      console.log("[useProjectPermissions] Project data:", data);
      return data;
    },
    enabled: !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) {
        console.log("[useProjectPermissions] Missing user ID or project ID for member check");
        return false;
      }

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      if (error) {
        console.error("[useProjectPermissions] Error checking project membership:", error);
        return false;
      }

      console.log("[useProjectPermissions] Membership check:", {
        projectId,
        userId: userProfile.id,
        isMember: !!data
      });
      return !!data;
    },
    enabled: !!userProfile?.id && !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: managerAccess } = useQuery({
    queryKey: ["managerProjectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId || !isManager) {
        console.log("[useProjectPermissions] Missing data for manager access check", {
          userId: userProfile?.id,
          projectId,
          isManager
        });
        return false;
      }

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      console.log("[useProjectPermissions] Manager access check:", {
        projectId,
        userId: userProfile.id,
        canAccess
      });
      return !!canAccess;
    },
    enabled: !!userProfile?.id && !!projectId && isManager,
    staleTime: 300000, // 5 minutes
  });

  const isProjectManager = projectData?.project_manager === userProfile?.email;

  const permissions = {
    canEdit: isAdmin || isProjectManager || (isManager && managerAccess),
    canManageTeam: isAdmin || isProjectManager,
    canDelete: isAdmin,
    isMember: !!isMember,
    isProjectManager,
  };

  console.log("[useProjectPermissions] Final permissions:", {
    projectId,
    userEmail: userProfile?.email,
    permissions,
    isAdmin,
    isManager,
    managerAccess,
    isProjectManager
  });

  return permissions;
};