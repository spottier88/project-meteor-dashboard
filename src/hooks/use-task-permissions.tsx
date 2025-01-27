import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTaskPermissions = (projectId: string) => {
  const user = useUser();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Ajout des logs pour tracer les appels à can_manager_access_project
  const { data: canAccess } = useQuery({
    queryKey: ["managerAccess", projectId, user?.id],
    queryFn: async () => {
      const isAdmin = userRoles?.some(role => role.role === "admin");
      const isProjectManager = project?.project_manager === userProfile?.email;

      if (!user?.id || !projectId || isAdmin || isProjectManager) {
        console.log("[useTaskPermissions] Skipping manager access check:", {
          userId: user?.id,
          projectId,
          isAdmin,
          isProjectManager
        });
        return false;
      }

      console.log("[useTaskPermissions] Checking manager access:", {
        userId: user?.id,
        projectId,
        timestamp: new Date().toISOString()
      });

      const startTime = performance.now();
      const { data: canAccess, error } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });
      const endTime = performance.now();

      console.log("[useTaskPermissions] Manager access check completed:", {
        result: canAccess,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        error: error?.message
      });

      if (error) {
        console.error("[useTaskPermissions] Error checking access:", error);
        return false;
      }

      return canAccess;
    },
    enabled: !!user?.id && !!projectId,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isProjectManager = project?.project_manager === userProfile?.email;

  const canCreateTask = isAdmin || isProjectManager;
  
  const canEditTask = (assignee?: string) => {
    if (isAdmin || isProjectManager) return true;
    return assignee === userProfile?.email;
  };

  const canDeleteTask = isAdmin || isProjectManager;

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    isAdmin,
    isProjectManager,
    isMember: false,
    userEmail: userProfile?.email,
  };
};