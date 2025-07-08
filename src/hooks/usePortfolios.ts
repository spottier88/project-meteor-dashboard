
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Portfolio, PortfolioWithStats, PortfolioFormData } from "@/types/portfolio";

export const usePortfolios = () => {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_portfolios")
        .select(`
          *,
          projects!inner(id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculer les statistiques pour chaque portefeuille
      const portfoliosWithStats: PortfolioWithStats[] = await Promise.all(
        data.map(async (portfolio) => {
          // Récupérer les projets du portefeuille avec leurs statistiques
          const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select(`
              id,
              latest_reviews!inner(completion)
            `)
            .eq("portfolio_id", portfolio.id);

          if (projectsError) {
            console.error("Erreur lors de la récupération des projets:", projectsError);
          }

          const projectCount = projects?.length || 0;
          const totalCompletion = projects?.reduce((sum, project) => {
            return sum + (project.latest_reviews?.[0]?.completion || 0);
          }, 0) || 0;
          const averageCompletion = projectCount > 0 ? Math.round(totalCompletion / projectCount) : 0;

          return {
            ...portfolio,
            project_count: projectCount,
            total_completion: totalCompletion,
            average_completion: averageCompletion,
          };
        })
      );

      return portfoliosWithStats;
    },
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
