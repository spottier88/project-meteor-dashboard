import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useProjectPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  return {
    canManageRisks: permissions.isAdmin || permissions.isProjectManager || canAccess,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false,
    userEmail: permissions.userEmail,
  };
};