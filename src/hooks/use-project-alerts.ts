
/**
 * @hook useProjectAlerts
 * @description Hook pour identifier les projets nécessitant une attention particulière.
 * Détecte les projets sans revue depuis 3 mois ou sans activité récente.
 */

import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AlertReason {
  type: 'no_review' | 'no_activity';
  daysSince: number;
}

interface ProjectAlert {
  project: {
    id: string;
    title: string;
    status: string;
  };
  reasons: AlertReason[];
}

export const useProjectAlerts = () => {
  const user = useUser();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["projectAlerts", user?.id],
    queryFn: async (): Promise<ProjectAlert[]> => {
      if (!user?.id) return [];

      // Récupérer les projets avec leurs dernières revues
      const { data: projectsData, error } = await supabase
        .rpc('get_accessible_projects_list_view', {
          p_user_id: user.id
        });

      if (error) {
        console.error("Error fetching projects for alerts:", error);
        throw error;
      }

      // S'assurer que nous avons un tableau
      const projects = Array.isArray(projectsData) ? projectsData : [];
      const alerts: ProjectAlert[] = [];
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      for (const project of projects) {
        const reasons: AlertReason[] = [];

        // Vérifier la dernière revue
        if (project.last_review_date) {
          const lastReviewDate = new Date(project.last_review_date);
          if (lastReviewDate < threeMonthsAgo) {
            const daysSince = Math.floor(
              (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            reasons.push({
              type: 'no_review',
              daysSince,
            });
          }
        } else {
          // Aucune revue n'a jamais été faite
          const createdDate = new Date(project.created_at || Date.now());
          if (createdDate < threeMonthsAgo) {
            const daysSince = Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            reasons.push({
              type: 'no_review',
              daysSince,
            });
          }
        }

        // Vérifier l'activité récente (tâches, risques, etc.)
        // Pour l'instant, on se base sur la date de dernière modification du projet
        // Cela pourrait être étendu pour inclure les tâches, risques, etc.
        if (project.updated_at) {
          const lastActivityDate = new Date(project.updated_at);
          if (lastActivityDate < threeMonthsAgo) {
            const daysSince = Math.floor(
              (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            reasons.push({
              type: 'no_activity',
              daysSince,
            });
          }
        }

        // Ajouter à la liste des alertes si des raisons existent
        if (reasons.length > 0) {
          alerts.push({
            project: {
              id: project.id,
              title: project.title,
              status: project.status || project.weather,
            },
            reasons,
          });
        }
      }

      // Trier par nombre de raisons (les plus critiques en premier)
      return alerts.sort((a, b) => b.reasons.length - a.reasons.length);
    },
    enabled: !!user?.id,
  });

  return {
    alerts: alerts || [],
    isLoading,
  };
};
