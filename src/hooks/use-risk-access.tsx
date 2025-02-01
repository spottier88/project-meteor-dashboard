import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useRiskAccess = (projectId: string) => {
  const { isAdmin, isProjectManager } = usePermissionsContext();
  
  const canManage = isAdmin || isProjectManager;

  return {
    canCreateRisk: canManage,
    canEditRisk: canManage,
    canDeleteRisk: canManage,
    canViewRisks: true // Tout le monde peut voir les risques s'ils ont accès au projet
  };
};