import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useTaskPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  const canCreateTask = permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager;
  
  const canEditTask = (assignee?: string) => {
    if (permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager) return true;
    return assignee === permissions.userEmail;
  };

  const canDeleteTask = permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager;

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