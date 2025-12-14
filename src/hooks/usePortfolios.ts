
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Portfolio, PortfolioWithStats, PortfolioFormData } from "@/types/portfolio";

/**
 * Hook pour récupérer la liste des portefeuilles avec leurs statistiques
 * Utilise le polling (refetchInterval) au lieu du Realtime pour compatibilité self-hosted
 */
export const usePortfolios = () => {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      // Récupérer d'abord tous les portefeuilles
      const { data: portfolios, error } = await supabase
        .from("project_portfolios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculer les statistiques pour chaque portefeuille via portfolio_projects
      const portfoliosWithStats: PortfolioWithStats[] = await Promise.all(
        portfolios.map(async (portfolio) => {
          // Récupérer les projets via la table de liaison portfolio_projects
          const { data: portfolioProjects, error: statsError } = await supabase
            .from("portfolio_projects")
            .select("project:projects(id, lifecycle_status)")
            .eq("portfolio_id", portfolio.id);

          if (statsError) {
            console.error("Erreur lors de la récupération des statistiques:", statsError);
          }

          // Extraire les projets de la réponse
          const projects = portfolioProjects
            ?.map(pp => pp.project)
            .filter((p): p is NonNullable<typeof p> => p !== null) || [];

          const totalProjects = projects.length;
          const completedProjects = projects.filter(p => p.lifecycle_status === 'completed').length;

          // Récupérer les complétions de TOUS les projets du portefeuille
          let averageCompletion = 0;
          if (totalProjects > 0) {
            const projectIds = projects.map(p => p.id);
            const { data: reviews, error: reviewsError } = await supabase
              .from("latest_reviews")
              .select("project_id, completion")
              .in("project_id", projectIds);

            if (!reviewsError && reviews) {
              // Créer un map des completions par projet
              const completionMap = new Map(reviews.map(r => [r.project_id, r.completion || 0]));
              
              // Calculer la moyenne en incluant TOUS les projets
              let totalCompletion = 0;
              projectIds.forEach(projectId => {
                totalCompletion += completionMap.get(projectId) || 0;
              });
              
              averageCompletion = Math.round(totalCompletion / totalProjects);
            }
          }

          return {
            ...portfolio,
            project_count: totalProjects,
            total_completion: completedProjects,
            average_completion: averageCompletion,
          };
        })
      );

      return portfoliosWithStats;
    },
    staleTime: 30000, // 30 secondes
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch quand l'utilisateur revient sur l'onglet
    refetchOnMount: 'always', // Toujours refetch au montage du composant
    refetchInterval: 60000, // Polling toutes les 60 secondes (remplace Realtime)
    refetchIntervalInBackground: false, // Pas de polling quand l'onglet est en arrière-plan
  });
};

export const useCreatePortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PortfolioFormData) => {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Vous devez être connecté pour créer un portefeuille");
      }

      console.log("Création du portefeuille avec utilisateur:", user.id);
      
      const { data: result, error } = await supabase
        .from("project_portfolios")
        .insert([{
          ...data,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la création du portefeuille:", error);
        throw error;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Succès",
        description: "Le portefeuille a été créé avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la création du portefeuille:", error);
      
      let errorMessage = "Une erreur est survenue lors de la création du portefeuille";
      
      // Messages d'erreur spécifiques
      if (error.code === '42501') {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour créer un portefeuille";
      } else if (error.message?.includes("authentifié")) {
        errorMessage = error.message;
      } else if (error.message?.includes("violates row-level security")) {
        errorMessage = "Permissions insuffisantes pour créer un portefeuille";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PortfolioFormData }) => {
      const { data: result, error } = await supabase
        .from("project_portfolios")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Succès",
        description: "Le portefeuille a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du portefeuille:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du portefeuille",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook pour supprimer un portefeuille avec nettoyage des relations
 * Supprime d'abord les relations (projets, gestionnaires, revues) puis le portefeuille
 */
export const useDeletePortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("Suppression du portefeuille:", id);

      // 1. Supprimer les notifications des revues du portefeuille
      const { data: reviews } = await supabase
        .from("portfolio_reviews")
        .select("id")
        .eq("portfolio_id", id);
      
      if (reviews && reviews.length > 0) {
        const reviewIds = reviews.map(r => r.id);
        const { error: notifError } = await supabase
          .from("portfolio_review_notifications")
          .delete()
          .in("portfolio_review_id", reviewIds);
        
        if (notifError) {
          console.error("Erreur suppression notifications revues:", notifError);
        }
      }

      // 2. Supprimer les revues du portefeuille
      const { error: reviewsError } = await supabase
        .from("portfolio_reviews")
        .delete()
        .eq("portfolio_id", id);

      if (reviewsError) {
        console.error("Erreur suppression revues:", reviewsError);
        throw new Error("Erreur lors de la suppression des revues du portefeuille");
      }

      // 3. Supprimer les liens projets-portefeuille
      const { error: projectsError } = await supabase
        .from("portfolio_projects")
        .delete()
        .eq("portfolio_id", id);

      if (projectsError) {
        console.error("Erreur suppression projets:", projectsError);
        throw new Error("Erreur lors de la suppression des projets du portefeuille");
      }

      // 4. Mettre à NULL les références portfolio_id dans projects (ancien mode de fonctionnement)
      const { error: projectsRefError } = await supabase
        .from("projects")
        .update({ portfolio_id: null })
        .eq("portfolio_id", id);

      if (projectsRefError) {
        console.error("Erreur nettoyage références projets:", projectsRefError);
        // On ne throw pas ici car c'est du nettoyage legacy
      }

      // 5. Supprimer les gestionnaires du portefeuille
      const { error: managersError } = await supabase
        .from("portfolio_managers")
        .delete()
        .eq("portfolio_id", id);

      if (managersError) {
        console.error("Erreur suppression gestionnaires:", managersError);
        throw new Error("Erreur lors de la suppression des gestionnaires du portefeuille");
      }

      // 6. Enfin, supprimer le portefeuille lui-même
      const { error } = await supabase
        .from("project_portfolios")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erreur suppression portefeuille:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Succès",
        description: "Le portefeuille a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression du portefeuille:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du portefeuille",
        variant: "destructive",
      });
    },
  });
};
