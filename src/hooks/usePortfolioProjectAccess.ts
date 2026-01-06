/**
 * Hook pour vérifier si l'utilisateur a un accès via portefeuille à un projet
 * Retourne isReadOnlyViaPortfolio = true si l'utilisateur n'a pas d'accès régulier
 * mais peut voir le projet via un portefeuille
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface PortfolioAccessInfo {
  portfolioId: string;
  portfolioName: string;
  role: 'owner' | 'manager' | 'viewer';
}

export const usePortfolioProjectAccess = (projectId: string) => {
  const { userProfile } = usePermissionsContext();

  // Vérifier si l'utilisateur a accès au projet via un portefeuille
  const { data: portfolioAccess, isLoading } = useQuery({
    queryKey: ["portfolioProjectAccess", projectId, userProfile?.id],
    queryFn: async (): Promise<PortfolioAccessInfo | null> => {
      if (!userProfile?.id || !projectId) return null;

      // Récupérer les portefeuilles contenant ce projet où l'utilisateur est gestionnaire
      const { data: portfolioManagerAccess } = await supabase
        .from("portfolio_projects")
        .select(`
          portfolio_id,
          project_portfolios!inner (
            id,
            name,
            created_by
          ),
          portfolio_managers!inner (
            user_id,
            role
          )
        `)
        .eq("project_id", projectId)
        .eq("portfolio_managers.user_id", userProfile.id);

      if (portfolioManagerAccess && portfolioManagerAccess.length > 0) {
        const access = portfolioManagerAccess[0];
        return {
          portfolioId: access.portfolio_id,
          portfolioName: (access.project_portfolios as any)?.name || "",
          role: (access.portfolio_managers as any)?.role || 'viewer'
        };
      }

      // Vérifier si l'utilisateur est le créateur d'un portefeuille contenant ce projet
      const { data: ownerAccess } = await supabase
        .from("portfolio_projects")
        .select(`
          portfolio_id,
          project_portfolios!inner (
            id,
            name,
            created_by
          )
        `)
        .eq("project_id", projectId)
        .eq("project_portfolios.created_by", userProfile.id);

      if (ownerAccess && ownerAccess.length > 0) {
        const access = ownerAccess[0];
        return {
          portfolioId: access.portfolio_id,
          portfolioName: (access.project_portfolios as any)?.name || "",
          role: 'owner'
        };
      }

      return null;
    },
    enabled: !!userProfile?.id && !!projectId,
    staleTime: 300000, // 5 minutes
  });

  return {
    hasAccessViaPortfolio: !!portfolioAccess,
    portfolioAccessInfo: portfolioAccess,
    isLoading
  };
};
