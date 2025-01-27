import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useManagerPermissions = (projectId: string) => {
  const user = useUser();

  const { data: permissions } = useQuery({
    queryKey: ["managerPermissions", user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return { canAccess: false };

      console.log("[useManagerPermissions] Checking access for project:", projectId);
      const startTime = performance.now();

      const { data: canAccess, error } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: user.id,
          p_project_id: projectId
        });

      const endTime = performance.now();
      console.log("[useManagerPermissions] Access check completed:", {
        result: canAccess,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });

      if (error) {
        console.error("[useManagerPermissions] Error checking access:", error);
        return { canAccess: false };
      }

      return { canAccess: !!canAccess };
    },
    enabled: !!user?.id && !!projectId,
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache pendant 10 minutes
    retry: 1,
    retryDelay: 1000,
  });

  return permissions?.canAccess ?? false;
};