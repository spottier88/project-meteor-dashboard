
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useMemo } from "react";

export const useManagerPermissions = (projectId: string) => {
  const { isAdmin, isManager } = usePermissionsContext();
  
  // Utiliser useMemo pour éviter les logs en boucle
  const hasManagerAccess = useMemo(() => {
    const result = isAdmin || isManager;
    
    console.log('useManagerPermissions for project:', projectId, {
      isAdmin,
      isManager,
      result
    });
    
    return result;
  }, [isAdmin, isManager, projectId]);
  
  // Un manager a les mêmes droits qu'un admin sur son périmètre
  return hasManagerAccess;
};
