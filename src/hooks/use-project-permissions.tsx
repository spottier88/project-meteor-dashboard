import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useProjectPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  return {
    // Un manager a les mêmes droits qu'un admin sur son périmètre
    canManageRisks: permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false,
    userEmail: permissions.userEmail,
  };
};