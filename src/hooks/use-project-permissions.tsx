import { useCentralizedPermissions } from "./use-centralized-permissions";

export const useProjectPermissions = (projectId: string) => {
  const permissions = useCentralizedPermissions(projectId);
  
  return {
    canManageRisks: permissions.isAdmin || permissions.canEdit,
    canEdit: permissions.canEdit,
    canManageTeam: permissions.canManageTeam,
    isAdmin: permissions.isAdmin,
    isProjectManager: permissions.isProjectManager,
    isOwner: false, // À implémenter si nécessaire
    userEmail: permissions.userEmail,
  };
};