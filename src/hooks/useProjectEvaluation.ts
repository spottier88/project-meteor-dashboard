/**
 * Hook pour récupérer l'évaluation d'un projet
 * Utilisé pour afficher l'onglet "Bilan" dans ProjectSummaryContent
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectEvaluation {
  id: string;
  project_id: string;
  what_worked: string | null;
  what_was_missing: string | null;
  improvements: string | null;
  lessons_learned: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

/**
 * Récupère l'évaluation d'un projet clôturé
 * @param projectId - L'identifiant du projet
 * @returns L'évaluation du projet ou null si non trouvée
 */
export const useProjectEvaluation = (projectId: string) => {
  return useQuery({
    queryKey: ["project-evaluation", projectId],
    queryFn: async (): Promise<ProjectEvaluation | null> => {
      const { data, error } = await supabase
        .from("project_evaluations")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error) {
        console.error("[useProjectEvaluation] Erreur lors de la récupération:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId,
  });
};
