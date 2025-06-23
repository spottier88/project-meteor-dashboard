
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface ReviewableProject {
  id: string;
  title: string;
  project_manager?: string;
  status?: string | null;
  weather?: string | null;
  last_review_date?: string | null;
  lastReviewDate?: string | null;
}

/**
 * Hook pour récupérer les projets pour lesquels l'utilisateur peut créer des revues
 * Utilise la fonction RPC get_reviewable_projects qui applique les règles métier :
 * - Admin : tous les projets
 * - Chef de projet principal : ses projets uniquement
 * - Chef de projet secondaire : ses projets uniquement
 * - Manager sans rôle chef de projet : aucun projet
 */
export const useReviewableProjects = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["reviewableProjects", user?.id],
    queryFn: async (): Promise<ReviewableProject[]> => {
      if (!user?.id) {
        console.log("[useReviewableProjects] Aucun utilisateur connecté");
        return [];
      }

      console.log("[useReviewableProjects] Récupération des projets reviewables pour l'utilisateur:", user.id);

      const { data, error } = await supabase.rpc('get_reviewable_projects', {
        p_user_id: user.id
      });

      if (error) {
        console.error("[useReviewableProjects] Erreur lors de la récupération des projets reviewables:", error);
        throw error;
      }

      console.log("[useReviewableProjects] Projets reviewables récupérés:", data?.length || 0);

      // Transformer les données pour assurer la compatibilité avec l'interface existante
      return (data || []).map(project => ({
        ...project,
        lastReviewDate: project.last_review_date, // Alias pour compatibilité
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
