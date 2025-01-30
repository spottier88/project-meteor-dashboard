import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useTaskAccess = (projectId: string, taskAssignee?: string) => {
  const { isAdmin, isManager, isProjectManager, userProfile } = usePermissionsContext();
  
  const canManage = isAdmin || isManager || isProjectManager;
  const isAssignedToTask = taskAssignee === userProfile?.email;

  return {
    canCreateTask: canManage,
    canEditTask: canManage || isAssignedToTask,
    canDeleteTask: canManage,
    isAssignedToTask
  };
};