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

      // Étape 1 : récupérer les portefeuilles contenant ce projet
      const { data: links } = await supabase
        .from("portfolio_projects")
        .select("portfolio_id")
        .eq("project_id", projectId);

      if (!links || links.length === 0) return null;

      const portfolioIds = links.map(l => l.portfolio_id);

      // Étape 2 : l'utilisateur est-il gestionnaire/viewer d'un de ces portefeuilles ?
      const { data: membership } = await supabase
        .from("portfolio_managers")
        .select("portfolio_id, role")
        .eq("user_id", userProfile.id)
        .in("portfolio_id", portfolioIds)
        .limit(1)
        .maybeSingle();

      // Étape 3 : vérifier aussi si l'utilisateur est le créateur d'un portefeuille
      const { data: ownedPortfolio } = await supabase
        .from("project_portfolios")
        .select("id, name")
        .in("id", portfolioIds)
        .eq("created_by", userProfile.id)
        .limit(1)
        .maybeSingle();

      // Résolution : priorité au rôle explicite, sinon owner
      if (membership) {
        const { data: pf } = await supabase
          .from("project_portfolios")
          .select("name")
          .eq("id", membership.portfolio_id)
          .single();
        return {
          portfolioId: membership.portfolio_id,
          portfolioName: pf?.name || "",
          role: (membership.role as 'owner' | 'manager' | 'viewer') || 'viewer'
        };
      }

      if (ownedPortfolio) {
        return {
          portfolioId: ownedPortfolio.id,
          portfolioName: ownedPortfolio.name || "",
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
