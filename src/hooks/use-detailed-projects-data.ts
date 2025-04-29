
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";

export type ProjectData = {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    progress: string | null;
    last_review_date: string | null;
    project_manager: string | null;
    project_manager_name: string | null;
    owner_id: string | null;
    pole_id: string | null;
    direction_id: string | null;
    service_id: string | null;
    lifecycle_status: string;
    start_date: string | null;
    end_date: string | null;
    pole_name: string | null;
    direction_name: string | null;
    service_name: string | null;
    code: string | null;
    for_entity_type: string | null;
    for_entity_id: string | null;
    for_entity_name: string | null;
    suivi_dgs: boolean | null;
    priority: string | null;
    completion: number;
    weather: string | null;
  };
  lastReview: {
    weather: string | null;
    progress: string | null;
    completion: number;
    comment: string | null;
    created_at: string | null;
    actions: Array<{
      id: string;
      description: string;
    }>;
  } | null;
  framing: Record<string, string | null> | null;
  innovation: Record<string, number> | null;
  risks: Array<{
    id: string;
    description: string;
    probability: string;
    severity: string;
    status: string;
    mitigation_plan: string | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    start_date: string | null;
    due_date: string | null;
    assignee: string | null;
    parent_task_id: string | null;
  }>;
};

export const useDetailedProjectsData = (projectIds: string[], enabled: boolean = false) => {
  return useQuery({
    queryKey: ["detailedProjects", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      try {
        console.log(`Récupération des données pour ${projectIds.length} projets en une seule requête`);
        
        // Utiliser la fonction PostgreSQL pour récupérer les données en une seule requête
        const { data, error } = await supabase
          .rpc('get_detailed_projects', { 
            p_project_ids: projectIds 
          });

        if (error) {
          console.error("Erreur lors de la récupération des données:", error);
          throw error;
        }

        if (!data) {
          console.log("Aucune donnée récupérée");
          return [];
        }

        // Vérifier si data est un tableau et qu'il contient des éléments
        const projectsData = Array.isArray(data) ? data as ProjectData[] : [];
        
        console.log(`${projectsData.length} projets récupérés avec succès`);
        return projectsData;
      } catch (error) {
        console.error("Erreur dans useDetailedProjectsData:", error);
        throw error;
      }
    },
    enabled: enabled || false,
    staleTime: 5 * 60 * 1000, // Cache les données pendant 5 minutes
  });
};
