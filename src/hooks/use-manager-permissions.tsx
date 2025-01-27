import { usePermissions } from "./use-permissions";

export const useManagerPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  return permissions.isAdmin || permissions.isManager || permissions.isProjectManager;
};