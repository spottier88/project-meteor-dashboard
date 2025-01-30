import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useRiskPermissions = (projectId: string) => {
  const { isAdmin, userEmail } = usePermissionsContext();
  
  return {
    canManageRisks: isAdmin,
    isAdmin,
    isProjectManager: false,
    userEmail,
  };
};