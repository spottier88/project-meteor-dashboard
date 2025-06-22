
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface ActivityType {
  id: string;
  code: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export const useActivityTypes = () => {
  const { user } = useAuthContext();
  
  return useQuery<ActivityType[]>({
    queryKey: ["activity-types", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("is_active", true)
        .order("label");
      
      if (error) {
        console.error("Erreur lors de la récupération des types d'activité:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
