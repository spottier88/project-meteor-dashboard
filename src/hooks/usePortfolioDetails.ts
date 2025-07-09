
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PortfolioWithStats } from "@/types/portfolio";

export const usePortfolioDetails = (portfolioId: string) => {
  return useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: async () => {
      // Récupérer le portefeuille
      const { data: portfolio, error: portfolioError } = await supabase
        .from("project_portfolios")
        .select("*")
        .eq("id", portfolioId)
        .single();

      if (portfolioError) throw portfolioError;

      // Récupérer les projets du portefeuille avec leurs dernières revues
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          project_manager,
          status,
          progress,
          start_date,
          end_date,
          lifecycle_status,
          priority,
          created_at
        `)
        .eq("portfolio_id", portfolioId);

      if (projectsError) throw projectsError;

      // Calculer les statistiques
      let totalCompletion = 0;
      let projectsWithCompletion = 0;
      let totalBudget = portfolio.budget_total || 0;
      let budgetConsumed = 0; // À implémenter selon la logique métier

      // Statistiques par statut
      const statusStats = {
        sunny: 0,
        cloudy: 0,
        stormy: 0
      };

      const lifecycleStats = {
        study: 0,
        validated: 0,
        in_progress: 0,
        completed: 0,
        suspended: 0,
        abandoned: 0
      };

      projects.forEach(project => {
        if (project.status) {
          statusStats[project.status as keyof typeof statusStats]++;
        }
        if (project.lifecycle_status) {
          lifecycleStats[project.lifecycle_status as keyof typeof lifecycleStats]++;
        }
      });

      const portfolioWithStats: PortfolioWithStats & { 
        projects: typeof projects;
        statusStats: typeof statusStats;
        lifecycleStats: typeof lifecycleStats;
        budgetConsumed: number;
      } = {
        ...portfolio,
        project_count: projects.length,
        total_completion: totalCompletion,
        average_completion: projectsWithCompletion > 0 ? Math.round(totalCompletion / projectsWithCompletion) : 0,
        projects,
        statusStats,
        lifecycleStats,
        budgetConsumed
      };

      return portfolioWithStats;
    },
    enabled: !!portfolioId,
  });
};

export const useRemoveProjectFromPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ portfolio_id: null })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      toast({
        title: "Succès",
        description: "Le projet a été retiré du portefeuille",
      });
    },
    onError: (error) => {
      console.error("Erreur lors du retrait du projet:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait du projet",
        variant: "destructive",
      });
    },
  });
};

export const useAddProjectsToPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ portfolioId, projectIds }: { portfolioId: string; projectIds: string[] }) => {
      const { error } = await supabase
        .from("projects")
        .update({ portfolio_id: portfolioId })
        .in("id", projectIds);

      if (error) throw error;
    },
    onSuccess: (_, { projectIds }) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      toast({
        title: "Succès",
        description: `${projectIds.length} projet(s) ajouté(s) au portefeuille`,
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout des projets:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout des projets",
        variant: "destructive",
      });
    },
  });
};
