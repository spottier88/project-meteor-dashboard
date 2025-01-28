import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, UserRoleData } from "@/types/user";

interface PermissionsResult {
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  isMember: boolean;
  canCreateProject: boolean;
  canEditProject: (projectId: string) => Promise<boolean>;
  canManageProjectMembers: (projectId: string) => Promise<boolean>;
  canManageRisks: (projectId: string) => Promise<boolean>;
  canManageTasks: (projectId: string) => Promise<boolean>;
  canViewProjectHistory: (projectId: string) => Promise<boolean>;
  userEmail?: string | null;
  userRoles?: UserRole[];
  isLoading: boolean;
}

export const usePermissions = (projectId?: string): PermissionsResult => {
  const user = useUser();

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        return null;
      }
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const roles = userRoles?.map(ur => ur.role) || [];
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isMember = roles.includes("membre");
  const isProjectManager = false; // Sera déterminé par projet

  const canCreateProject = roles.some(role => role === "admin" || role === "chef_projet");

  const canEditProject = async (projectId: string): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      if (isAdmin) return true;

      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      return !!canAccess;
    } catch (error) {
      console.error("Error in canEditProject:", error);
      return false;
    }
  };

  const canManageProjectMembers = async (projectId: string): Promise<boolean> => {
    return canEditProject(projectId);
  };

  const canManageRisks = async (projectId: string): Promise<boolean> => {
    return canEditProject(projectId);
  };

  const canManageTasks = async (projectId: string): Promise<boolean> => {
    return canEditProject(projectId);
  };

  const canViewProjectHistory = async (projectId: string): Promise<boolean> => {
    return canEditProject(projectId);
  };

  return {
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    canCreateProject,
    canEditProject,
    canManageProjectMembers,
    canManageRisks,
    canManageTasks,
    canViewProjectHistory,
    userEmail: userProfile?.email,
    userRoles: roles,
    isLoading: isLoadingProfile || isLoadingRoles,
  };
};