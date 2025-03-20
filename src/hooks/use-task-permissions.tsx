
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTaskPermissions = (projectId: string) => {
  const { isAdmin, userProfile } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
        isProjectManager: false,
        isSecondaryProjectManager: false,
      };

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      if (isAdmin || isProjectManager) {
        return {
          canEdit: true,
          isProjectManager,
          isSecondaryProjectManager: false,
        };
      }

      // Vérifier si l'utilisateur est un chef de projet secondaire
      const { data: projectMember } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const isSecondaryProjectManager = projectMember?.role === 'secondary_manager';

      // Vérifier l'accès via la fonction can_manager_access_project
      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      return {
        canEdit: !!canAccess || isSecondaryProjectManager,  // Uniquement si l'utilisateur a des droits d'accès spécifiques à ce projet
        isProjectManager,
        isSecondaryProjectManager,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });

  // Un utilisateur peut gérer les tâches seulement s'il est admin, s'il a des droits d'édition spécifiques
  // sur ce projet ou s'il est chef de projet secondaire
  const canManage = isAdmin || projectAccess?.canEdit || projectAccess?.isSecondaryProjectManager || false;
  
  return {
    canCreateTask: canManage,
    canEditTask: (assignee?: string) => canManage || assignee === userProfile?.email,
    canDeleteTask: canManage,
    isAdmin,
    isProjectManager: projectAccess?.isProjectManager || false,
    isSecondaryProjectManager: projectAccess?.isSecondaryProjectManager || false,
    isMember: false,
    userEmail: userProfile?.email,
  };
};
