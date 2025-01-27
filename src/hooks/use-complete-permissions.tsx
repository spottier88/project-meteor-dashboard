import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCompletePermissions = (projectId: string) => {
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

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", projectId, user?.id],
    queryFn: async () => {
      if (!projectId || !user?.id) return false;
      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!projectId && !!user?.id,
  });

  const { data: isManager } = useQuery({
    queryKey: ["isProjectManager", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!userRoles?.some(ur => ur.role === "manager")) return false;

      const { data } = await supabase.rpc("can_manager_access_project", {
        p_user_id: user.id,
        p_project_id: projectId
      });

      return !!data;
    },
    enabled: !!projectId && !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isProjectManager = project?.project_manager === userProfile?.email;

  // Droits sur le projet
  const canViewProject = isAdmin || isProjectManager || isManager || isMember;
  const canEditProject = isAdmin || isProjectManager || isManager;
  const canDeleteProject = isAdmin || isProjectManager;

  // Droits sur les tâches
  const canCreateTask = isAdmin || isProjectManager || isManager;
  const canEditTask = (assignee?: string) => {
    if (isAdmin || isProjectManager || isManager) return true;
    return isMember && assignee === userProfile?.email;
  };
  const canDeleteTask = isAdmin || isProjectManager;

  // Droits sur les risques
  const canCreateRisk = isAdmin || isProjectManager || isManager;
  const canEditRisk = isAdmin || isProjectManager || isManager;
  const canDeleteRisk = isAdmin || isProjectManager;

  // Droits sur les revues
  const canCreateReview = isAdmin || isProjectManager || isManager;
  const canViewReviews = canViewProject;
  const canAddCorrectiveActions = canCreateReview;

  // Droits sur les membres
  const canManageMembers = isAdmin || isProjectManager;
  const canViewMembers = canViewProject;

  return {
    isAdmin,
    isProjectManager,
    isManager,
    isMember,
    userEmail: userProfile?.email,
    
    // Projet
    canViewProject,
    canEditProject,
    canDeleteProject,
    
    // Tâches
    canCreateTask,
    canEditTask,
    canDeleteTask,
    
    // Risques
    canCreateRisk,
    canEditRisk,
    canDeleteRisk,
    
    // Revues
    canCreateReview,
    canViewReviews,
    canAddCorrectiveActions,
    
    // Membres
    canManageMembers,
    canViewMembers,
  };
};