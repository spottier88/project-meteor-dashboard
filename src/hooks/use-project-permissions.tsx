import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectPermissions = (projectId: string) => {
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
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
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
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
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
    staleTime: 30 * 1000, // Cache pendant 30 secondes
  });

  const { data: canAccess } = useQuery({
    queryKey: ["managerAccess", projectId, user?.id],
    queryFn: async () => {
      const isAdmin = userRoles?.some(role => role.role === "admin");
      const isProjectManager = project?.project_manager === userProfile?.email;

      if (!user?.id || !projectId || isAdmin || isProjectManager) {
        return false;
      }

      const { data: canAccess, error } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      if (error) {
        console.error("[useProjectPermissions] Error checking access:", error);
        return false;
      }

      return canAccess;
    },
    enabled: !!user?.id && !!projectId,
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache pendant 10 minutes
    retry: 1,
    retryDelay: 1000,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isProjectManager = project?.project_manager === userProfile?.email;
  const isOwner = project?.owner_id === user?.id;

  const canManageRisks = isAdmin || isProjectManager || isOwner || canAccess;

  return {
    canManageRisks,
    isAdmin,
    isProjectManager,
    isOwner,
    userEmail: userProfile?.email,
  };
};