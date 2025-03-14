
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTaskPermissions = (projectId: string) => {
  const { isAdmin, isManager, userProfile } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id, isAdmin, isManager],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
        isProjectManager: false,
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
        };
      }

      // Vérifier l'accès via la fonction can_manager_access_project
      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      return {
        canEdit: !!canAccess || isManager,  // Manager a des droits d'édition
        isProjectManager,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });

  // Managers peuvent créer/modifier/supprimer des tâches
  const canManage = isAdmin || isManager || projectAccess?.canEdit || false;
  
  return {
    canCreateTask: canManage,
    canEditTask: (assignee?: string) => canManage || assignee === userProfile?.email,
    canDeleteTask: canManage,
    isAdmin,
    isManager,
    isProjectManager: projectAccess?.isProjectManager || false,
    isMember: false,
    userEmail: userProfile?.email,
  };
};
