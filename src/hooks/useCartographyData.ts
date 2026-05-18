/**
 * @hook useCartographyData
 * @description Agrège les données nécessaires à la cartographie d'un portefeuille :
 * complète les projets du portefeuille avec leur direction et leur score moyen d'innovation.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CartographyProject {
  id: string;
  title: string;
  project_manager: string | null;
  weather: "sunny" | "cloudy" | "stormy" | null;
  lifecycle_status: "study" | "validated" | "in_progress" | "completed" | "suspended" | "abandoned";
  completion: number;
  last_review_date: string | null;
  direction_id: string | null;
  direction_name: string | null;
  pole_id: string | null;
  innovation_score: number; // moyenne 0-5
  is_innovative: boolean;   // score >= seuil
}

const INNOVATION_THRESHOLD = 3;

export const useCartographyData = (portfolioId: string, projectIds: string[]) => {
  return useQuery({
    queryKey: ["cartographyData", portfolioId, projectIds.sort().join(",")],
    queryFn: async (): Promise<{
      directionIds: string[];
      directionMap: Map<string, { name: string; pole_id: string | null }>;
      enrichmentByProject: Map<string, { direction_id: string | null; pole_id: string | null; innovation_score: number }>;
    }> => {
      if (projectIds.length === 0) {
        return { directionIds: [], directionMap: new Map(), enrichmentByProject: new Map() };
      }

      // Récupération des directions / pôles des projets
      const { data: projectsExtra, error: projectsErr } = await supabase
        .from("projects")
        .select("id, direction_id, pole_id")
        .in("id", projectIds);
      if (projectsErr) throw projectsErr;

      // Récupération des scores d'innovation
      const { data: scores, error: scoresErr } = await supabase
        .from("project_innovation_scores")
        .select("project_id, novateur, usager, ouverture, agilite, impact")
        .in("project_id", projectIds);
      if (scoresErr) throw scoresErr;

      const scoreMap = new Map<string, number>();
      (scores || []).forEach((s) => {
        const vals = [s.novateur, s.usager, s.ouverture, s.agilite, s.impact].map((v) => v || 0);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        scoreMap.set(s.project_id, avg);
      });

      const directionIds = Array.from(
        new Set((projectsExtra || []).map((p) => p.direction_id).filter(Boolean) as string[])
      );

      let directionMap = new Map<string, { name: string; pole_id: string | null }>();
      if (directionIds.length > 0) {
        const { data: directions } = await supabase
          .from("directions")
          .select("id, name, pole_id")
          .in("id", directionIds);
        directionMap = new Map(
          (directions || []).map((d) => [d.id, { name: d.name, pole_id: d.pole_id }])
        );
      }

      const enrichmentByProject = new Map<
        string,
        { direction_id: string | null; pole_id: string | null; innovation_score: number }
      >();
      (projectsExtra || []).forEach((p) => {
        enrichmentByProject.set(p.id, {
          direction_id: p.direction_id,
          pole_id: p.pole_id,
          innovation_score: scoreMap.get(p.id) || 0,
        });
      });

      return { directionIds, directionMap, enrichmentByProject };
    },
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Combine les projets du portefeuille avec les enrichissements (direction + innovation).
 */
export const buildCartographyProjects = (
  portfolioProjects: Array<{
    id: string;
    title: string;
    project_manager: string | null;
    status: "sunny" | "cloudy" | "stormy" | null;
    lifecycle_status: "study" | "validated" | "in_progress" | "completed" | "suspended" | "abandoned";
    completion: number;
    last_review_date: string | null;
  }>,
  enrichment: Map<string, { direction_id: string | null; pole_id: string | null; innovation_score: number }>,
  directionMap: Map<string, { name: string; pole_id: string | null }>
): CartographyProject[] => {
  return portfolioProjects.map((p) => {
    const extra = enrichment.get(p.id);
    const direction_id = extra?.direction_id || null;
    const direction_name = direction_id ? directionMap.get(direction_id)?.name || null : null;
    const innovation_score = extra?.innovation_score || 0;
    return {
      id: p.id,
      title: p.title,
      project_manager: p.project_manager,
      weather: p.status,
      lifecycle_status: p.lifecycle_status,
      completion: p.completion || 0,
      last_review_date: p.last_review_date,
      direction_id,
      direction_name,
      pole_id: extra?.pole_id || null,
      innovation_score,
      is_innovative: innovation_score >= INNOVATION_THRESHOLD,
    };
  });
};
