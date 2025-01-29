import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

export const useProjectAccess = (projectId: string) => {
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(ur => ur.role);
    },
    enabled: !!user?.id,
  });

  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) return {
        canAccess: false,
        canManage: false,
        isProjectManager: false,
        isMember: false
      };

      // Vérifier si l'utilisateur est admin
      const isAdmin = userRoles?.includes("admin") || false;
      if (isAdmin) {
        console.log('User is admin, granting full access');
        return {
          canAccess: true,
          canManage: true,
          isProjectManager: false,
          isMember: false
        };
      }

      // Vérifier si l'utilisateur est le chef de projet
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === profile?.email;

      // Vérifier si l'utilisateur est membre du projet
      const { data: membership } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      const isMember = !!membership;

      // Vérifier si l'utilisateur est manager avec accès
      const { data: managerAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      const isManagerWithAccess = !!managerAccess;

      console.log('Project access check for project:', projectId, {
        isProjectManager,
        isMember,
        isManagerWithAccess,
        userRoles
      });

      return {
        canAccess: isProjectManager || isMember || isManagerWithAccess,
        canManage: isProjectManager || isManagerWithAccess,
        isProjectManager,
        isMember
      };
    },
    enabled: !!user?.id && !!projectId,
  });

  return {
    ...projectAccess,
    isLoading: !projectAccess,
    userRoles
  };
};