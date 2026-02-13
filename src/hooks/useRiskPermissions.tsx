import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";

export const useRiskPermissions = () => {
  const { userProfile } = usePermissionsContext();
  const { effectiveAdminStatus: isAdmin } = useAdminModeAwareData();
  
  return {
    canManageRisks: isAdmin,
    isAdmin,
    isProjectManager: false,
    userEmail: userProfile?.email,
  };
};