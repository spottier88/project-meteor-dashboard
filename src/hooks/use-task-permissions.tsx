import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useTaskPermissions = (projectId: string) => {
  const { isAdmin, userEmail } = usePermissionsContext();
  
  const canCreateTask = isAdmin;
  
  const canEditTask = (assignee?: string) => {
    if (isAdmin) return true;
    return assignee === userEmail;
  };

  const canDeleteTask = isAdmin;

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    isAdmin,
    isProjectManager: false,
    isMember: false,
    userEmail,
  };
};