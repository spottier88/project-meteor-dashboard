
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { checkUserCanCreatePortfolio } from "@/utils/portfolioPermissions";

export const usePortfolioPermissions = () => {
  const { hasRole } = usePermissionsContext();
  const { effectiveAdminStatus: isAdmin } = useAdminModeAwareData();
  const user = useUser();

  // Vérifier si l'utilisateur peut créer des portefeuilles
  const { data: canCreateFromDB } = useQuery({
    queryKey: ["can-create-portfolio", user?.id],
    queryFn: () => checkUserCanCreatePortfolio(user?.id || ""),
    enabled: !!user?.id && !isAdmin, // Pas besoin de vérifier si déjà admin
  });

  // Les permissions basées sur le contexte et la base de données
  const canCreatePortfolio = isAdmin || hasRole('portfolio_manager') || canCreateFromDB || false;
  const canManagePortfolios = isAdmin || hasRole('portfolio_manager');
  const canViewPortfolios = isAdmin || hasRole('portfolio_manager');

  return {
    canCreatePortfolio,
    canManagePortfolios,
    canViewPortfolios,
  };
};
