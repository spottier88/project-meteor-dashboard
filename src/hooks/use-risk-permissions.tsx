import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useRiskPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  const canManageRisks = permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager;

  return {
    canManageRisks,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    userEmail: permissions.userEmail,
  };
};