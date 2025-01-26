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

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isProjectManager = project?.project_manager === userProfile?.email;
  const isMember = !isAdmin && !isProjectManager;

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
    isMember,
    userEmail: userProfile?.email,
  };
};