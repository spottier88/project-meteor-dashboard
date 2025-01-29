import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectAccess {
  canAccess: boolean;
  isProjectManager: boolean;
}

interface PermissionsResult {
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  canEdit: boolean;
  canManageTeam: boolean;
  userEmail: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useCentralizedPermissions = (projectId?: string): PermissionsResult => {
  const user = useUser();

  console.log("useCentralizedPermissions - Current user:", user?.id);
  console.log("useCentralizedPermissions - Project ID:", projectId);

  // Requête pour le profil utilisateur avec cache
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      console.log("User profile data:", data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  // Requête pour les rôles utilisateur avec cache
  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("User roles data:", data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000,
    gcTime: 600000,
  });

  // Requête pour l'accès au projet avec cache
  const { data: projectAccess, isLoading: isLoadingAccess, error } = useQuery({
    queryKey: ["projectAccess", user?.id, projectId],
    queryFn: async (): Promise<ProjectAccess> => {
      if (!user?.id || !projectId) {
        return { canAccess: false, isProjectManager: false };
      }

      // Récupérer les informations du projet
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile?.email;

      console.log("Project manager check:", {
        projectManager: project?.project_manager,
        userEmail: userProfile?.email,
        isProjectManager
      });

      // Vérifie l'accès via la fonction RPC
      if (userRoles?.some(ur => ur.role === 'manager')) {
        const { data: canAccess } = await supabase
          .rpc("can_manager_access_project", {
            p_user_id: user.id,
            p_project_id: projectId
          });

        console.log("Manager access check:", {
          canAccess,
          userId: user.id,
          projectId
        });

        return {
          canAccess: canAccess || isProjectManager,
          isProjectManager
        };
      }

      return {
        canAccess: isProjectManager,
        isProjectManager
      };
    },
    enabled: !!user?.id && !!projectId && !!userProfile,
    staleTime: 300000,
    gcTime: 600000,
  });

  const isLoading = isLoadingProfile || isLoadingRoles || isLoadingAccess;
  const roles = userRoles?.map(ur => ur.role) || [];
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  console.log("Final permissions state:", {
    isAdmin,
    isManager,
    projectAccess,
    userEmail: userProfile?.email
  });

  return {
    isAdmin,
    isManager,
    isProjectManager: projectAccess?.isProjectManager || false,
    canEdit: isAdmin || isManager || projectAccess?.isProjectManager || false,
    canManageTeam: isAdmin || projectAccess?.isProjectManager || false,
    userEmail: userProfile?.email || null,
    isLoading,
    error,
  };
};