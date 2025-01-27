import { usePermissions } from "./use-permissions";

export const useTaskPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  
  const canCreateTask = permissions.isAdmin || permissions.isProjectManager;
  
  const canEditTask = (assignee?: string) => {
    if (permissions.isAdmin || permissions.isProjectManager) return true;
    return assignee === permissions.userEmail;
  };

  const canDeleteTask = permissions.isAdmin || permissions.isProjectManager;

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isMember: permissions.isMember,
    userEmail: permissions.userEmail,
  };
};