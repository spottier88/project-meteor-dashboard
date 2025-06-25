
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { RiskProbability, RiskSeverity, RiskStatus } from "@/types/risk";

export type ProjectData = {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: ProjectStatus | null;
    progress: ProgressStatus | null;
    last_review_date: string | null;
    project_manager: string | null;
    project_manager_name: string | null;
    owner_id: string | null;
    pole_id: string | null;
    direction_id: string | null;
    service_id: string | null;
    lifecycle_status: ProjectLifecycleStatus;
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
    weather: ProjectStatus | null;
  };
  lastReview: {
    weather: ProjectStatus | null;
    progress: ProgressStatus | null;
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
    probability: RiskProbability;
    severity: RiskSeverity;
    status: RiskStatus;
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
      if (!projectIds || projectIds.length === 0) return [];

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
        if (!Array.isArray(data) || data.length === 0) {
          console.log("Les données récupérées ne sont pas au format attendu ou sont vides");
          return [];
        }

        // Cast des données retournées au type ProjectData, en vérifiant que les valeurs
        // des enums sont bien assignées correctement
        const projectsData: ProjectData[] = data.map((item: any) => {
          // S'assurer que les types d'enum sont correctement assignés
          const typedItem = { ...item };
          
          // Conversion explicite pour project.status
          if (typedItem.project && typeof typedItem.project.status === 'string') {
            const status = typedItem.project.status as string;
            typedItem.project.status = status as ProjectStatus;
          }
          
          // Conversion explicite pour project.progress
          if (typedItem.project && typeof typedItem.project.progress === 'string') {
            const progress = typedItem.project.progress as string;
            typedItem.project.progress = progress as ProgressStatus;
          }
          
          // Conversion explicite pour project.lifecycle_status
          if (typedItem.project && typeof typedItem.project.lifecycle_status === 'string') {
            typedItem.project.lifecycle_status = typedItem.project.lifecycle_status as ProjectLifecycleStatus;
          }
          
          // Conversion pour lastReview.weather et lastReview.progress si présents
          if (typedItem.lastReview) {
            if (typeof typedItem.lastReview.weather === 'string') {
              const weather = typedItem.lastReview.weather as string;
              typedItem.lastReview.weather = weather as ProjectStatus;
            }
            
            if (typeof typedItem.lastReview.progress === 'string') {
              const progress = typedItem.lastReview.progress as string;
              typedItem.lastReview.progress = progress as ProgressStatus;
            }
          }
          
          // Conversion des risques
          if (typedItem.risks && Array.isArray(typedItem.risks)) {
            typedItem.risks = typedItem.risks.map(risk => ({
              ...risk,
              probability: risk.probability as RiskProbability,
              severity: risk.severity as RiskSeverity,
              status: risk.status as RiskStatus
            }));
          }
          
          return typedItem as ProjectData;
        });
        
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
