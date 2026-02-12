
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus, ForEntityType, Project, ProjectWithExtendedData } from "@/types/project";
import { MonitoringLevel } from "@/types/monitoring";
import { useAdminModeAwareData } from "./useAdminModeAwareData";

export interface ProjectListItem {
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
  for_entity_type: ForEntityType | null;
  for_entity_id: string | null;
  suivi_dgs: boolean | null;
  priority: string | null;
  monitoring_level: MonitoringLevel | null;
  monitoring_entity_id: string | null;
  completion: number;
  weather: ProjectStatus | null;
  review_created_at: string | null;
  review_progress: ProgressStatus | null;
}

// Fonction utilitaire pour convertir ProjectListItem en Project si nécessaire
export const convertToProject = (item: ProjectListItem): Project => {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    status: item.status,
    progress: item.progress,
    completion: item.completion,
    lastReviewDate: item.last_review_date,
    project_manager: item.project_manager || undefined,
    owner_id: item.owner_id || undefined,
    pole_id: item.pole_id || undefined,
    direction_id: item.direction_id || undefined,
    service_id: item.service_id || undefined,
    lifecycle_status: item.lifecycle_status,
    for_entity_type: item.for_entity_type,
    for_entity_id: item.for_entity_id || undefined,
    weather: item.weather
  };
};

export const useProjectsListView = (enabled = true) => {
  const user = useUser();
  const { adminModeDisabled } = useAdminModeAwareData();

  return useQuery({
    queryKey: ["projectsListView", user?.id, adminModeDisabled],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .rpc('get_accessible_projects_list_view_with_admin_mode', {
            p_user_id: user.id,
            p_admin_mode_disabled: adminModeDisabled
          });

        if (error) {
          console.error("Erreur lors de la récupération des projets:", error);
          throw error;
        }

        if (!data) {
          return [];
        }

        // Typage explicite des données et conversion du JSON en ProjectListItem[]
        const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        const projects: ProjectListItem[] = Array.isArray(jsonData) 
          ? jsonData.map((item: any) => ({
              ...item,
              id: item.id,
              title: item.title,
              description: item.description,
              lifecycle_status: item.lifecycle_status as ProjectLifecycleStatus,
              status: item.status as ProjectStatus | null,
              progress: item.progress as ProgressStatus | null,
              weather: item.weather as ProjectStatus | null,
              review_progress: item.review_progress as ProgressStatus | null,
              monitoring_level: item.monitoring_level as MonitoringLevel | null,
              completion: item.completion || 0,
              last_review_date: item.last_review_date,
              project_manager: item.project_manager,
              project_manager_name: item.project_manager_name,
              owner_id: item.owner_id,
              pole_id: item.pole_id,
              direction_id: item.direction_id,
              service_id: item.service_id,
              start_date: item.start_date,
              end_date: item.end_date,
              pole_name: item.pole_name,
              direction_name: item.direction_name,
              service_name: item.service_name,
              for_entity_type: item.for_entity_type as ForEntityType,
              for_entity_id: item.for_entity_id,
              suivi_dgs: item.suivi_dgs,
              priority: item.priority,
              monitoring_entity_id: item.monitoring_entity_id,
              review_created_at: item.review_created_at
            }))
          : [];
        
        return projects;
      } catch (error) {
        console.error("Erreur dans useProjectsListView:", error);
        throw error;
      }
    },
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60 * 1000, // Cache les données pendant 5 minutes
  });
};
