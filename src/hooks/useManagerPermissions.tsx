
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useMemo } from "react";

export const useManagerPermissions = (projectId?: string) => {
  const { isManager } = usePermissionsContext();
  const { effectiveAdminStatus: isAdmin } = useAdminModeAwareData();
  
  // Utiliser useMemo pour éviter les logs en boucle
  const hasManagerAccess = useMemo(() => {
    const result = isAdmin || isManager;
    
 //   console.log('useManagerPermissions for project:', projectId, {
 //     isAdmin,
 //     isManager,
      result
 //   });
    
    return result;
  }, [isAdmin, isManager, projectId]);
  
  // Un manager a les mêmes droits qu'un admin sur son périmètre
  return hasManagerAccess;
};
