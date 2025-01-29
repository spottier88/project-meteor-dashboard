import { useCentralizedPermissions } from "./use-centralized-permissions";

export const useRiskPermissions = (projectId: string) => {
  const permissions = useCentralizedPermissions(projectId);
  
  return {
    canManageRisks: permissions.isAdmin || permissions.canEdit,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    userEmail: permissions.userEmail,
  };
};