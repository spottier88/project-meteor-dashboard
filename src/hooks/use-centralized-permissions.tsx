import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user";

interface PermissionsResult {
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  canEdit: boolean;
  canManageTeam: boolean;
  userEmail?: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useCentralizedPermissions = (projectId?: string) => {
  const user = useUser();

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
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutes
    cacheTime: 10 * 60 * 1000, // Garde en cache 10 minutes
  });

  // Requête pour les rôles avec cache
  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Requête pour l'accès au projet spécifique avec cache
  const { data: projectAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ["projectAccess", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) return null;
      
      // Vérifie si l'utilisateur est le chef de projet
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile?.email;

      // Vérifie l'accès via la fonction RPC
      if (userRoles?.some(ur => ur.role === 'manager')) {
        const { data: canAccess } = await supabase
          .rpc('can_manager_access_project', {
            p_user_id: user.id,
            p_project_id: projectId
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const roles = userRoles?.map(ur => ur.role as UserRole) || [];
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  return {
    isAdmin,
    isManager,
    isProjectManager: projectAccess?.isProjectManager || false,
    canEdit: isAdmin || projectAccess?.canAccess || false,
    canManageTeam: isAdmin || projectAccess?.canAccess || false,
    userEmail: userProfile?.email,
    isLoading: isLoadingProfile || isLoadingRoles || isLoadingAccess,
    error: null,
  };
};