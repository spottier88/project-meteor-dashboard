
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";

export const useActivityTypes = (activeOnly: boolean = true) => {
  return useQuery({
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
};
