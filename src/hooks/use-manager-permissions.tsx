import { usePermissions } from "./use-permissions";
import { useProjectAccess } from "./use-project-access";

export const useManagerPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const { data: canAccess } = useProjectAccess(projectId);
  
  // Un manager a les mêmes droits qu'un admin sur son périmètre
  return permissions.isAdmin || (permissions.isManager && canAccess);
};