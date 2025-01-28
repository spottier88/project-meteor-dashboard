import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

export const useManagerProjectAccess = (projectIds: string[]) => {
  const user = useUser();

  return useQuery({
    queryKey: ["projectAccess", projectIds, user?.id],
    queryFn: async () => {
      if (!user?.id || projectIds.length === 0) return new Map<string, boolean>();

      const { data, error } = await supabase
        .rpc('can_manager_access_projects', {
          p_user_id: user.id,
          p_project_ids: projectIds
        });

      if (error) {
        console.error("Error checking project access:", error);
        return new Map<string, boolean>();
      }

      return new Map(data.map((item: { project_id: string; can_access: boolean }) => 
        [item.project_id, item.can_access]
      ));
    },
    enabled: !!user?.id && projectIds.length > 0,
  });
};