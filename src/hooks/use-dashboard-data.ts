
/**
 * @hook useDashboardData
 * @description Hook pour récupérer et agréger les données nécessaires au tableau de bord.
 * Calcule les statistiques sur les projets de l'utilisateur avec catégorisation par type d'accès.
 */

import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { useUserProjectMemberships } from "./use-user-project-memberships";
import { differenceInDays } from "date-fns";

interface DashboardSummary {
  total: number;
  asProjectManager: number;    // Chef de projet (email match)
  asMember: number;            // Membre explicite (project_members)
  asHierarchyManager: number;  // Visible via droits hiérarchiques (manager)
  withoutReview: number;       // Projets actifs sans revue récente
  portfolioCount: number;      // Nombre de portefeuilles accessibles
  byWeather: Record<string, number>;
  byLifecycle: Record<string, number>;
}

// Statuts de cycle de vie considérés comme "actifs" pour les alertes de revue
const ACTIVE_LIFECYCLE_STATUSES = ['study', 'validated', 'in_progress'];

export const useDashboardData = () => {
  const user = useUser();
  const { userProfile } = usePermissionsContext();
  const { adminModeDisabled } = useAdminModeAwareData();
  const { data: userMemberships, isLoading: isMembershipsLoading } = useUserProjectMemberships();

  // Récupérer le nombre de portefeuilles accessibles
  const { data: portfolioCount } = useQuery({
    queryKey: ["dashboardPortfolioCount", user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("portfolio_managers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur récupération portefeuilles:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboardSummary", user?.id, adminModeDisabled, userMemberships ? Array.from(userMemberships) : null],
    queryFn: async (): Promise<DashboardSummary> => {
      if (!user?.id || !userProfile) {
        return {
          total: 0,
          asProjectManager: 0,
          asMember: 0,
          asHierarchyManager: 0,
          withoutReview: 0,
          portfolioCount: 0,
          byWeather: {},
          byLifecycle: {},
        };
      }

      // Récupérer les projets accessibles via la fonction RPC mise à jour
      const { data: projectsData, error } = await supabase
        .rpc('get_accessible_projects_list_view_with_admin_mode', {
          p_user_id: user.id,
          p_admin_mode_disabled: adminModeDisabled
        });

      if (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
      }

      // S'assurer que nous avons un tableau
      const projects = Array.isArray(projectsData) ? projectsData as any[] : [];
      
      // Calculer les statistiques
      let asProjectManager = 0;
      let asMember = 0;
      let asHierarchyManager = 0;
      let withoutReview = 0;
      const byWeather: Record<string, number> = {};
      const byLifecycle: Record<string, number> = {};

      const memberships = userMemberships || new Set<string>();
      const now = new Date();

      projects.forEach((project: any) => {
        // Catégoriser par type d'accès
        const isProjectManager = project.project_manager === userProfile.email;
        const isExplicitMember = memberships.has(project.id);

        if (isProjectManager) {
          asProjectManager++;
        } else if (isExplicitMember) {
          asMember++;
        } else {
          // Ni CP ni membre = accès via hiérarchie ou portfolio
          asHierarchyManager++;
        }

        // Compter les projets actifs sans revue récente
        const isActiveProject = ACTIVE_LIFECYCLE_STATUSES.includes(project.lifecycle_status);
        if (isActiveProject) {
          if (!project.last_review_date) {
            withoutReview++;
          } else {
            const daysSinceReview = differenceInDays(now, new Date(project.last_review_date));
            if (daysSinceReview > 30) {
              withoutReview++;
            }
          }
        }

        // Compter par météo
        const weather = project.weather || 'null';
        byWeather[weather] = (byWeather[weather] || 0) + 1;

        // Compter par cycle de vie
        const lifecycle = project.lifecycle_status || 'unknown';
        byLifecycle[lifecycle] = (byLifecycle[lifecycle] || 0) + 1;
      });

      return {
        total: projects.length,
        asProjectManager,
        asMember,
        asHierarchyManager,
        withoutReview,
        portfolioCount: portfolioCount || 0,
        byWeather,
        byLifecycle,
      };
    },
    enabled: !!user?.id && !!userProfile && !isMembershipsLoading,
  });

  return {
    summary: summary || {
      total: 0,
      asProjectManager: 0,
      asMember: 0,
      asHierarchyManager: 0,
      withoutReview: 0,
      portfolioCount: portfolioCount || 0,
      byWeather: {},
      byLifecycle: {},
    },
    isLoading: isLoading || isMembershipsLoading,
  };
};
