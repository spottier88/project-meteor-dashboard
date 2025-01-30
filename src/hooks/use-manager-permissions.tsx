import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useManagerPermissions = (projectId: string) => {
  const { isAdmin, isManager } = usePermissionsContext();
  
  console.log('useManagerPermissions for project:', projectId, {
    isAdmin,
    isManager,
    result: isAdmin || isManager
  });
  
  // Un manager a les mêmes droits qu'un admin sur son périmètre
  return isAdmin || isManager;
};