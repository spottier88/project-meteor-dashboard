import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useRiskPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const projectAccess = useProjectAccess(projectId);
  
  const canManageRisks = permissions.isAdmin || (permissions.isManager && projectAccess.canAccess) || permissions.isProjectManager;

  return {
    canManageRisks,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    userEmail: permissions.userEmail,
  };
};