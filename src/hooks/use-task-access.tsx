import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { useProjectAccess } from "./use-project-access";

export const useTaskAccess = (projectId: string, taskAssignee?: string) => {
  const user = useUser();
  const { canManage } = useProjectAccess(projectId);

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isAssignedToTask = taskAssignee === userProfile?.email;

  return {
    canCreateTask: canManage,
    canEditTask: canManage || isAssignedToTask,
    canDeleteTask: canManage,
    isAssignedToTask
  };
};