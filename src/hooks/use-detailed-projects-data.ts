
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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

        if (!data || data.length === 0) {
          console.log("Aucune donnée récupérée");
          return [];
        }

        console.log(`${data.length} projets récupérés avec succès`);
        return data;
      } catch (error) {
        console.error("Erreur dans useDetailedProjectsData:", error);
        throw error;
      }
    },
    enabled: enabled || false,
    staleTime: 5 * 60 * 1000, // Cache les données pendant 5 minutes
  });
};
