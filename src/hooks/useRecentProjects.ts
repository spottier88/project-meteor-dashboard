import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";

/**
 * Hook pour récupérer les projets récemment utilisés par l'utilisateur
 * Basé sur l'historique des points d'activité
 */
export const useRecentProjects = () => {
  const session = useSession();

  return useQuery({
    queryKey: ["recentProjects", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      // Récupérer les projets distincts utilisés récemment
      const { data: recentPoints, error } = await supabase
        .from("activity_points")
        .select("project_id, projects(id, title)")
        .eq("user_id", session.user.id)
        .not("project_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Dédupliquer et garder les 5 premiers projets uniques
      const uniqueProjects = new Map();
      recentPoints?.forEach((point: any) => {
        if (point.projects && !uniqueProjects.has(point.project_id)) {
          uniqueProjects.set(point.project_id, point.projects);
        }
      });

      return Array.from(uniqueProjects.values()).slice(0, 5);
    },
    enabled: !!session?.user?.id,
  });
};
