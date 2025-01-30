import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useTaskPermissions = (projectId: string) => {
  const { isAdmin, userProfile } = usePermissionsContext();
  
  const canCreateTask = isAdmin;
  
  const canEditTask = (assignee?: string) => {
    if (isAdmin) return true;
    return assignee === userProfile?.email;
  };

  const canDeleteTask = isAdmin;

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    isAdmin,
    isProjectManager: false,
    isMember: false,
    userEmail: userProfile?.email,
  };
};