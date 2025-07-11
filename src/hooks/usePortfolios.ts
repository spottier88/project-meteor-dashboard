import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Portfolio, PortfolioWithStats, PortfolioFormData } from "@/types/portfolio";
import { useEffect } from "react";

export const usePortfolios = () => {
  const queryClient = useQueryClient();

  // Configuration de la synchronisation en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('portfolio-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_portfolios'
        },
        () => {
          // Invalider et refetch les données des portefeuilles
          queryClient.invalidateQueries({ queryKey: ["portfolios"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          // Si un projet change de portefeuille, invalider les données
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if (newRecord?.portfolio_id || oldRecord?.portfolio_id) {
            queryClient.invalidateQueries({ queryKey: ["portfolios"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      // Récupérer d'abord tous les portefeuilles
      const { data: portfolios, error } = await supabase
        .from("project_portfolios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculer les statistiques pour chaque portefeuille de manière optimisée
      const portfoliosWithStats: PortfolioWithStats[] = await Promise.all(
        portfolios.map(async (portfolio) => {
          // Récupérer tous les projets du portefeuille
          const { data: projectStats, error: statsError } = await supabase
            .from("projects")
            .select("id, lifecycle_status")
            .eq("portfolio_id", portfolio.id);

          if (statsError) {
            console.error("Erreur lors de la récupération des statistiques:", statsError);
          }

          const totalProjects = projectStats?.length || 0;
          const completedProjects = projectStats?.filter(p => p.lifecycle_status === 'completed').length || 0;

          // Récupérer les complétions de TOUS les projets du portefeuille
          let averageCompletion = 0;
          if (totalProjects > 0) {
            const projectIds = projectStats?.map(p => p.id) || [];
            const { data: reviews, error: reviewsError } = await supabase
              .from("latest_reviews")
              .select("project_id, completion")
              .in("project_id", projectIds);

            if (!reviewsError && reviews) {
              // Créer un map des completions par projet
              const completionMap = new Map(reviews.map(r => [r.project_id, r.completion || 0]));
              
              // Calculer la moyenne en incluant TOUS les projets
              // Les projets sans revues ont une completion de 0
              let totalCompletion = 0;
              projectIds.forEach(projectId => {
                totalCompletion += completionMap.get(projectId) || 0;
              });
              
              // Utiliser le nombre total de projets comme dénominateur
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
    staleTime: 60000, // 1 minute - réduire pour plus de réactivité
    cacheTime: 300000, // 5 minutes
  });
};

export const useCreatePortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PortfolioFormData) => {
      const { data: result, error } = await supabase
        .from("project_portfolios")
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Succès",
        description: "Le portefeuille a été créé avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la création du portefeuille:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du portefeuille",
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

export const useDeletePortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_portfolios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Succès",
        description: "Le portefeuille a été supprimé avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du portefeuille:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du portefeuille",
        variant: "destructive",
      });
    },
  });
};
