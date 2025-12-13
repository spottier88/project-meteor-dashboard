/**
 * @file usePortfolioRole.ts
 * @description Hook pour récupérer le rôle de l'utilisateur courant sur un portefeuille spécifique
 * Permet de différencier les droits entre owner, manager et viewer
 */

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export type PortfolioRole = "owner" | "manager" | "viewer" | null;

interface PortfolioRoleResult {
  /** Rôle de l'utilisateur sur le portefeuille */
  userRole: PortfolioRole;
  /** L'utilisateur est-il propriétaire du portefeuille */
  isOwner: boolean;
  /** L'utilisateur est-il gestionnaire du portefeuille */
  isManager: boolean;
  /** L'utilisateur est-il lecteur du portefeuille */
  isViewer: boolean;
  /** L'utilisateur peut-il gérer le portefeuille (owner, manager ou admin) */
  canManage: boolean;
  /** L'utilisateur peut-il éditer le portefeuille (owner, manager ou admin) */
  canEdit: boolean;
  /** L'utilisateur peut-il supprimer le portefeuille (owner ou admin uniquement) */
  canDelete: boolean;
  /** Chargement en cours */
  isLoading: boolean;
  /** L'utilisateur est-il admin global */
  isAdmin: boolean;
}

/**
 * Hook pour récupérer le rôle de l'utilisateur sur un portefeuille spécifique
 * @param portfolioId - ID du portefeuille
 * @returns Objet contenant le rôle et les permissions de l'utilisateur
 */
export const usePortfolioRole = (portfolioId: string): PortfolioRoleResult => {
  const user = useUser();
  const { hasRole } = usePermissionsContext();
  const isAdmin = hasRole("admin");

  const { data: roleData, isLoading } = useQuery({
    queryKey: ["portfolio-role", portfolioId, user?.id],
    queryFn: async () => {
      if (!user?.id || !portfolioId) return null;

      // Vérifier si l'utilisateur est le créateur du portefeuille
      const { data: portfolioData } = await supabase
        .from("project_portfolios")
        .select("created_by")
        .eq("id", portfolioId)
        .single();

      if (portfolioData?.created_by === user.id) {
        return "owner" as PortfolioRole;
      }

      // Vérifier le rôle dans portfolio_managers
      const { data: managerData } = await supabase
        .from("portfolio_managers")
        .select("role")
        .eq("portfolio_id", portfolioId)
        .eq("user_id", user.id)
        .single();

      if (managerData) {
        return managerData.role as PortfolioRole;
      }

      return null;
    },
    enabled: !!user?.id && !!portfolioId && !isAdmin,
    staleTime: 30000, // Cache pendant 30 secondes
  });

  // Si admin, il a tous les droits
  if (isAdmin) {
    return {
      userRole: "owner",
      isOwner: true,
      isManager: true,
      isViewer: true,
      canManage: true,
      canEdit: true,
      canDelete: true,
      isLoading: false,
      isAdmin: true,
    };
  }

  const userRole = roleData || null;
  const isOwner = userRole === "owner";
  const isManager = userRole === "manager";
  const isViewer = userRole === "viewer";

  return {
    userRole,
    isOwner,
    isManager,
    isViewer,
    canManage: isOwner || isManager,
    canEdit: isOwner || isManager,
    canDelete: isOwner,
    isLoading,
    isAdmin: false,
  };
};
