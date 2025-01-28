import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useManagerPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  return permissions.isAdmin || permissions.isManager || permissions.isProjectManager || !!canAccess;
};