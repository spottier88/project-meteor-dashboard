import { usePermissions } from "./use-permissions";
import { useManagerProjectAccess } from "./use-manager-project-access";

export const useProjectPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: projectAccess } = useManagerProjectAccess([projectId]);
  
  return {
    canManageRisks: permissions.isAdmin || (permissions.isManager && (projectAccess?.get(projectId) || false)) || permissions.isProjectManager,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false,
    userEmail: permissions.userEmail,
  };
};