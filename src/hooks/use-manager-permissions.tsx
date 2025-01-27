import { usePermissions } from "./use-permissions";

export const useManagerPermissions = (projectId: string) => {
  const { isAdmin, isManager, isProjectManager } = usePermissions(projectId);
  return isAdmin || isManager || isProjectManager;
};