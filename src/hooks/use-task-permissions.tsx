import { useCentralizedPermissions } from "./use-centralized-permissions";

export const useTaskPermissions = (projectId: string) => {
  const permissions = useCentralizedPermissions(projectId);
  
  const canCreateTask = permissions.isAdmin || permissions.canEdit;
  
  const canEditTask = (assignee?: string) => {
    if (permissions.isAdmin || permissions.canEdit) return true;
    return assignee === permissions.userEmail;
  };

  const canDeleteTask = permissions.isAdmin || permissions.canEdit;

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isMember: false,
    userEmail: permissions.userEmail,
  };
};