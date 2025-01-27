import { usePermissions } from "./use-permissions";

export const useProjectPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  
  return {
    canManageRisks: permissions.canManageRisks(projectId),
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false, // Cette valeur sera déterminée par canManageRisks
    userEmail: permissions.userEmail,
  };
};