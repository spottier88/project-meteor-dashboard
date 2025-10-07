import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour récupérer et gérer le quota de points hebdomadaire pour les activités
 * @returns {Object} - Contient le quota, le statut de chargement et les erreurs éventuelles
 */
export const useActivityPointsQuota = () => {
  const { data: quota, isLoading, error } = useQuery({
    queryKey: ["activityPointsQuota"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("value")
        .eq("type", "activity")
        .eq("key", "weekly_points_quota")
        .single();

      if (error) {
        // Si le paramètre n'existe pas encore, retourner la valeur par défaut
        if (error.code === "PGRST116") {
          return 10;
        }
        throw error;
      }

      return parseInt(data.value, 10) || 10;
    },
  });

  return {
    quota: quota ?? 10,
    isLoading,
    error,
  };
};
