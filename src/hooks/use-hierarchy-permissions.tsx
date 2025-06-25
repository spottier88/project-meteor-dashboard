import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHierarchyPermissions = (projectId: string) => {
  const user = useUser();

  const { data: canAccess, isLoading } = useQuery({
    queryKey: ["projectAccess", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) return false;

      const { data, error } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      if (error) {
        console.error("Error checking project access:", error);
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