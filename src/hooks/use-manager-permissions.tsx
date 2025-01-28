import { usePermissions } from "./use-permissions";
import { useHierarchyPermissions } from "./use-hierarchy-permissions";

export const useManagerPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { canAccess } = useHierarchyPermissions(projectId);
  
  return permissions.isAdmin || permissions.isManager || permissions.isProjectManager || canAccess;
};