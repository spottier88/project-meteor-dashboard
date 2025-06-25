
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";
import { useUserActivityTypePermissions } from "./useUserActivityTypePermissions";
import { useSession } from "@supabase/auth-helpers-react";

export const useActivityTypes = (activeOnly: boolean = true, respectPermissions: boolean = true) => {
  const session = useSession();
  const { permittedTypes, isLoading: isLoadingPermissions } = useUserActivityTypePermissions();
  const isAdmin = session?.user?.id ? session.user.app_metadata?.claims_admin : false;

  // Pour garantir la compatibilité avec React Query, nous utilisons toujours useQuery
  // même lorsque nous retournons les types filtrés
  const { data: allTypes, isLoading: isLoadingAllTypes } = useQuery({
    queryKey: ["activity-types", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("activity_types")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching activity types:", error);
        throw error;
      }
      
      return data as ActivityType[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Si on respecte les permissions et que l'utilisateur n'est pas admin
  if (respectPermissions && !isAdmin && permittedTypes) {
    return {
      data: permittedTypes,
      isLoading: isLoadingPermissions || isLoadingAllTypes,
      error: null
    };
  }

  // Sinon, on renvoie tous les types d'activités (comportement original)
  return {
    data: allTypes || [],
    isLoading: isLoadingAllTypes,
    error: null
  };
};
