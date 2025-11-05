import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PortfolioWithStats } from "@/types/portfolio";

/**
 * Fonction utilitaire pour récupérer les revues par lots de projets
 * Évite les erreurs 502 dues aux URLs trop longues avec de nombreux project IDs
 */
const fetchReviewsInChunks = async (projectIds: string[]) => {
  const CHUNK_SIZE = 50; // Taille sûre pour éviter les URL trop longues
  const chunks: string[][] = [];
  
  // Diviser les project IDs en lots
  for (let i = 0; i < projectIds.length; i += CHUNK_SIZE) {
    chunks.push(projectIds.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`[Portfolio Reviews] Chargement de ${projectIds.length} projets en ${chunks.length} requête(s)`);
  
  // Effectuer toutes les requêtes en parallèle
  const results = await Promise.all(
    chunks.map(chunk =>
      supabase
        .from("latest_reviews")
        .select("project_id, completion")
        .in("project_id", chunk)
    )
  );
  
  // Vérifier les erreurs
  const firstError = results.find(r => r.error);
  if (firstError?.error) throw firstError.error;
  
  // Combiner tous les résultats
  return results.flatMap(r => r.data || []);
};

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

      // Récupérer les données de completion depuis latest_reviews pour chaque projet
      // Utilise la pagination pour éviter les erreurs 502 avec de nombreux projets
      const reviewsData = await fetchReviewsInChunks(projects.map(p => p.id));

      // Créer un map des completions par projet
      const completionMap = new Map(reviewsData?.map(r => [r.project_id, r.completion]) || []);

      // Enrichir les projets avec leurs données de completion
      const enrichedProjects = projects.map(project => ({
        ...project,
        completion: completionMap.get(project.id) || 0
      }));

      // Calculer les statistiques
      let totalCompletion = 0;
      let projectsWithCompletion = 0;
      let totalBudget = portfolio.budget_total || 0;
      let budgetConsumed = 0; // À implémenter selon la logique métier

      // Calculer l'avancement moyen basé sur les données de completion
      enrichedProjects.forEach(project => {
        if (project.completion !== null && project.completion !== undefined) {
          totalCompletion += project.completion;
          projectsWithCompletion++;
        }
      });

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

      enrichedProjects.forEach(project => {
        if (project.status) {
          statusStats[project.status as keyof typeof statusStats]++;
        }
        if (project.lifecycle_status) {
          lifecycleStats[project.lifecycle_status as keyof typeof lifecycleStats]++;
        }
      });

      const portfolioWithStats: PortfolioWithStats & { 
        projects: typeof enrichedProjects;
        statusStats: typeof statusStats;
        lifecycleStats: typeof lifecycleStats;
        budgetConsumed: number;
      } = {
        ...portfolio,
        project_count: enrichedProjects.length,
        total_completion: totalCompletion,
        average_completion: projectsWithCompletion > 0 ? Math.round(totalCompletion / projectsWithCompletion) : 0,
        projects: enrichedProjects,
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
