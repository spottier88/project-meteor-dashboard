import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useProjectPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { canAccess, canManage } = useProjectAccess(projectId);
  
  return {
    canManageRisks: permissions.isAdmin || (permissions.isManager && canAccess) || permissions.isProjectManager,
    canEdit: permissions.isAdmin || permissions.isProjectManager || canManage,
    canManageTeam: permissions.isAdmin || permissions.isProjectManager || canManage,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false, // À implémenter si nécessaire
    userEmail: permissions.userEmail,
  };
};