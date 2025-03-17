
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { ActivityType } from "@/types/activity";

/**
 * Hook pour récupérer les types d'activités auxquels l'utilisateur a accès
 * selon ses affectations hiérarchiques
 */
export const useUserActivityTypePermissions = () => {
  const session = useSession();
  const userId = session?.user?.id;

  // Récupérer tous les types d'activités
  const { data: allActivityTypes, isLoading: isLoadingAllTypes } = useQuery({
    queryKey: ["all-activity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) {
        console.error("Error fetching activity types:", error);
        throw error;
      }
      
      return data as ActivityType[];
    },
  });

  // Vérifier quels types d'activités l'utilisateur peut utiliser
  const { data: permittedTypes, isLoading } = useQuery({
    queryKey: ["permitted-activity-types", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (!allActivityTypes || allActivityTypes.length === 0) return [];

      // Pour chaque type d'activité, vérifier si l'utilisateur peut l'utiliser
      const permissionChecks = await Promise.all(
        allActivityTypes.map(async (type) => {
          const { data, error } = await supabase
            .rpc("can_use_activity_type", {
              p_user_id: userId,
              p_activity_type_code: type.code,
            });

          if (error) {
            console.error(`Error checking permission for ${type.code}:`, error);
            return null;
          }

          return data ? type : null;
        })
      );

      // Filtrer les types null et retourner les types autorisés
      return permissionChecks.filter(Boolean) as ActivityType[];
    },
    enabled: !!userId && !!allActivityTypes && allActivityTypes.length > 0,
  });

  return {
    permittedTypes,
    isLoading: isLoading || isLoadingAllTypes,
    isAdmin: session ? !!session.user : false,
  };
};
