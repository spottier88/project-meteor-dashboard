
import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitaire pour vérifier les permissions des portefeuilles côté client
 * Ces fonctions complètent les politiques RLS côté serveur
 */

export const checkUserCanCreatePortfolio = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  // Vérifier si l'utilisateur a le rôle admin ou portfolio_manager
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  return userRoles?.some(ur => ur.role === "admin" || ur.role === "portfolio_manager") || false;
};

export const checkUserCanManagePortfolio = async (
  userId: string, 
  portfolioId: string
): Promise<boolean> => {
  if (!userId || !portfolioId) return false;

  // Utiliser la fonction RLS can_manage_portfolio
  const { data, error } = await supabase
    .rpc('can_manage_portfolio', {
      p_user_id: userId,
      p_portfolio_id: portfolioId
    });

  if (error) {
    console.error("Erreur lors de la vérification des permissions de gestion:", error);
    return false;
  }

  return data || false;
};

export const checkUserCanViewPortfolio = async (
  userId: string, 
  portfolioId: string
): Promise<boolean> => {
  if (!userId || !portfolioId) return false;

  // Utiliser la fonction RLS can_view_portfolio
  const { data, error } = await supabase
    .rpc('can_view_portfolio', {
      p_user_id: userId,
      p_portfolio_id: portfolioId
    });

  if (error) {
    console.error("Erreur lors de la vérification des permissions de visualisation:", error);
    return false;
  }

  return data || false;
};
