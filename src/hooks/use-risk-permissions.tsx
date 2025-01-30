import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useRiskPermissions = (projectId: string) => {
  const { isAdmin, userProfile } = usePermissionsContext();
  
  return {
    canManageRisks: isAdmin,
    isAdmin,
    isProjectManager: false,
    userEmail: userProfile?.email,
  };
};