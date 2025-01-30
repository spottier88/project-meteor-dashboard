

export const useRiskAccess = (projectId: string) => {
  const { canManage } = useProjectAccess(projectId);

  return {
    canCreateRisk: canManage,
    canEditRisk: canManage,
    canDeleteRisk: canManage,
    canViewRisks: true // Tout le monde peut voir les risques s'ils ont accès au projet
  };
};
