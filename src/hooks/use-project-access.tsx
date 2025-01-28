import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

export const useProjectAccess = (projectId: string) => {
  const user = useUser();

  return useQuery({
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
    staleTime: 30000, // Cache pendant 30 secondes
    enabled: !!user?.id && !!projectId,
  });
};