
/**
 * @hook useDashboardData
 * @description Hook pour récupérer et agréger les données nécessaires au tableau de bord.
 * Calcule les statistiques sur les projets de l'utilisateur.
 */

import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface DashboardSummary {
  total: number;
  asManager: number;
  asMember: number;
  withAlerts: number;
  byWeather: Record<string, number>;
  byLifecycle: Record<string, number>;
}

export const useDashboardData = () => {
  const user = useUser();
  const { userProfile } = usePermissionsContext();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboardSummary", user?.id],
    queryFn: async (): Promise<DashboardSummary> => {
      if (!user?.id || !userProfile) {
        return {
          total: 0,
          asManager: 0,
          asMember: 0,
          withAlerts: 0,
          byWeather: {},
          byLifecycle: {},
        };
      }

      // Récupérer les projets accessibles via la fonction RPC existante
      const { data: projectsData, error } = await supabase
        .rpc('get_accessible_projects_list_view', {
          p_user_id: user.id
        });

      if (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
      }

      // S'assurer que nous avons un tableau et typer correctement les données
      const projects = Array.isArray(projectsData) ? projectsData as any[] : [];
      
      // Calculer les statistiques
      let asManager = 0;
      let asMember = 0;
      const byWeather: Record<string, number> = {};
      const byLifecycle: Record<string, number> = {};

      projects.forEach((project: any) => {
        // Compter par rôle
        if (project.project_manager === userProfile.email) {
          asManager++;
        } else {
          asMember++;
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
        asManager,
        asMember,
        withAlerts: 0, // Sera calculé par le hook d'alertes
        byWeather,
        byLifecycle,
      };
    },
    enabled: !!user?.id && !!userProfile,
  });

  return {
    summary: summary || {
      total: 0,
      asManager: 0,
      asMember: 0,
      withAlerts: 0,
      byWeather: {},
      byLifecycle: {},
    },
    isLoading,
  };
};
