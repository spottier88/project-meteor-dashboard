
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

export interface AccessiblePortfolio {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export const useAccessiblePortfolios = () => {
  const user = useUser();

  return useQuery({
    queryKey: ["accessible-portfolios", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer d'abord tous les portefeuilles où l'utilisateur peut assigner des projets
      const { data: portfolios, error } = await supabase
        .from("project_portfolios")
        .select("id, name, description, status")
        .order("name");

      if (error) {
        console.error("Erreur lors de la récupération des portefeuilles:", error);
        throw error;
      }

      if (!portfolios) return [];

      // Filtrer les portefeuilles selon les permissions de l'utilisateur
      const accessiblePortfolios = [];
      
      for (const portfolio of portfolios) {
        const { data: canAssign, error: permissionError } = await supabase
          .rpc('can_assign_to_portfolio', {
            p_user_id: user.id,
            p_portfolio_id: portfolio.id
          });

        if (permissionError) {
          console.error("Erreur lors de la vérification des permissions:", permissionError);
          continue;
        }

        if (canAssign) {
          accessiblePortfolios.push(portfolio);
        }
      }

      return accessiblePortfolios as AccessiblePortfolio[];
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};
