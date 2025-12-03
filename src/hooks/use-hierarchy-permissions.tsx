import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour vérifier les permissions d'accès d'un manager à un projet
 * Utilise le système unifié manager_path_assignments via la fonction RPC can_manager_access_project
 */
export const useHierarchyPermissions = (projectId: string) => {
  const user = useUser();

  const { data: canAccess, isLoading } = useQuery({
    queryKey: ["projectHierarchyAccess", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) return false;

      // Utilise la fonction RPC qui vérifie via manager_path_assignments
      const { data, error } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      if (error) {
        console.error("Error checking project hierarchy access:", error);
        return false;
      }

      return data;
    },
    enabled: !!user?.id && !!projectId,
  });

  return {
    canAccess: canAccess || false,
    isLoading
  };
};