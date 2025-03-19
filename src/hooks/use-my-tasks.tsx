
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useMyTasks = (showOverdueOnly: boolean = false) => {
  const { userProfile } = usePermissionsContext();
  
  return useQuery({
    queryKey: ["myTasks", userProfile?.email, showOverdueOnly],
    queryFn: async () => {
      if (!userProfile?.email) {
        return [];
      }

      let query = supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            title
          )
        `)
        .eq("assignee", userProfile.email);

      if (showOverdueOnly) {
        // Filtrer pour obtenir uniquement les tâches en retard (date d'échéance < aujourd'hui et non terminées)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        query = query
          .lt("due_date", todayStr)
          .neq("status", "done");
      }

      const { data, error } = await query.order("due_date", { ascending: true });

      if (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userProfile?.email,
  });
};
