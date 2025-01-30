import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectPermissions {
  canEdit: boolean;
  canManageTeam: boolean;
  canDelete: boolean;
  isMember: boolean;
  isProjectManager: boolean;
}

export const useProjectPermissions = (projectId: string): ProjectPermissions => {
  const { userProfile, isAdmin, isManager } = usePermissionsContext();
  
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
        return null;
      }

      return data;
    },
    enabled: !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return false;

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking project membership:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!userProfile?.id && !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: managerAccess } = useQuery({
    queryKey: ["managerProjectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId || !isManager) return false;

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      return !!canAccess;
    },
    enabled: !!userProfile?.id && !!projectId && isManager,
    staleTime: 300000, // 5 minutes
  });

  const isProjectManager = projectData?.project_manager === userProfile?.email;

  console.log("ProjectPermissions - State:", {
    projectId,
    userEmail: userProfile?.email,
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    managerAccess,
    projectManager: projectData?.project_manager
  });

  return {
    canEdit: isAdmin || isProjectManager || (isManager && managerAccess),
    canManageTeam: isAdmin || isProjectManager,
    canDelete: isAdmin,
    isMember: !!isMember,
    isProjectManager,
  };
};