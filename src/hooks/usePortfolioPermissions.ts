
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const usePortfolioPermissions = () => {
  const { isAdmin, hasRole } = usePermissionsContext();

  const canCreatePortfolio = isAdmin || hasRole('portfolio_manager');
  const canManagePortfolios = isAdmin || hasRole('portfolio_manager');
  const canViewPortfolios = isAdmin || hasRole('portfolio_manager');

  return {
    canCreatePortfolio,
    canManagePortfolios,
    canViewPortfolios,
  };
};
