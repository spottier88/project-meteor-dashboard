/**
 * Hook pour récupérer toutes les évaluations de projets
 * Utilisé dans la page EvaluationsManagement pour la vue transversale
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EvaluationFilters {
  poleId?: string;
  directionId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface EvaluationWithProject {
  id: string;
  project_id: string;
  what_worked: string | null;
  what_was_missing: string | null;
  improvements: string | null;
  lessons_learned: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  // Données du projet jointes
  project: {
    id: string;
    title: string;
    project_manager: string | null;
    pole_id: string | null;
    direction_id: string | null;
    service_id: string | null;
    end_date: string | null;
    closed_at: string | null;
    pole?: { name: string } | null;
    direction?: { name: string } | null;
    service?: { name: string } | null;
  } | null;
}

/**
 * Récupère toutes les évaluations avec filtres optionnels
 * @param filters - Filtres à appliquer (pôle, direction, service, période, recherche)
 * @returns Liste des évaluations avec les données de projet associées
 */
export const useAllEvaluations = (filters: EvaluationFilters = {}) => {
  return useQuery({
    queryKey: ["all-evaluations", filters],
    queryFn: async (): Promise<EvaluationWithProject[]> => {
      // Construction de la requête de base avec jointure sur projects
      let query = supabase
        .from("project_evaluations")
        .select(`
          *,
          project:projects!project_id (
            id,
            title,
            project_manager,
            pole_id,
            direction_id,
            service_id,
            end_date,
            closed_at,
            pole:poles!pole_id (name),
            direction:directions!direction_id (name),
            service:services!service_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("[useAllEvaluations] Erreur lors de la récupération:", error);
        throw error;
      }

      // Filtrage côté client (car les filtres sont sur la table jointe)
      let filteredData = (data || []) as EvaluationWithProject[];

      // Filtrer les évaluations dont le projet joint est inaccessible (RLS projects)
      filteredData = filteredData.filter(e => e.project !== null);

      // Filtre par pôle
      if (filters.poleId) {
        filteredData = filteredData.filter(
          e => e.project?.pole_id === filters.poleId
        );
      }

      // Filtre par direction
      if (filters.directionId) {
        filteredData = filteredData.filter(
          e => e.project?.direction_id === filters.directionId
        );
      }

      // Filtre par service
      if (filters.serviceId) {
        filteredData = filteredData.filter(
          e => e.project?.service_id === filters.serviceId
        );
      }

      // Filtre par date de début (date de clôture >= startDate)
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredData = filteredData.filter(e => {
          if (!e.project?.closed_at) return false;
          return new Date(e.project.closed_at) >= startDate;
        });
      }

      // Filtre par date de fin (date de clôture <= endDate)
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filteredData = filteredData.filter(e => {
          if (!e.project?.closed_at) return false;
          return new Date(e.project.closed_at) <= endDate;
        });
      }

      // Filtre par recherche textuelle (titre du projet ou chef de projet)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(e => {
          const title = e.project?.title?.toLowerCase() || "";
          const manager = e.project?.project_manager?.toLowerCase() || "";
          return title.includes(searchLower) || manager.includes(searchLower);
        });
      }

      return filteredData;
    },
  });
};
