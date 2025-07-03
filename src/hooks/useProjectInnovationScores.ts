
/**
 * @hook useProjectInnovationScores
 * @description Hook pour récupérer les scores d'innovation d'un projet.
 * Gère le chargement des données d'innovation depuis la table project_innovation_scores.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectInnovationScores = (projectId: string) => {
  return useQuery({
    queryKey: ["projectInnovationScores", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("project_innovation_scores")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur lors du chargement des scores d'innovation:", error);
        // Retourner des valeurs par défaut en cas d'erreur
        return {
          novateur: 0,
          usager: 0,
          ouverture: 0,
          agilite: 0,
          impact: 0,
        };
      }
      
      // Si aucun score n'existe, retourner des valeurs par défaut
      if (!data) {
        return {
          novateur: 0,
          usager: 0,
          ouverture: 0,
          agilite: 0,
          impact: 0,
        };
      }
      
      return {
        novateur: data.novateur || 0,
        usager: data.usager || 0,
        ouverture: data.ouverture || 0,
        agilite: data.agilite || 0,
        impact: data.impact || 0,
      };
    },
    enabled: !!projectId,
    staleTime: 300000, // 5 minutes
  });
};
