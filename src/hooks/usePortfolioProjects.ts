
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePortfolioProjects = (portfolioId: string) => {
  return useQuery({
    queryKey: ["portfolio-projects", portfolioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          status,
          progress,
          lifecycle_status,
          start_date,
          end_date,
          project_manager,
          created_at
        `)
        .eq("portfolio_id", portfolioId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!portfolioId,
  });
};

export const useAvailableProjects = () => {
  return useQuery({
    queryKey: ["available-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          status,
          lifecycle_status,
          project_manager,
          portfolio_id
        `)
        .order("title");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddProjectToPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectIds, portfolioId }: { projectIds: string[], portfolioId: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ portfolio_id: portfolioId })
        .in("id", projectIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
      queryClient.invalidateQueries({ queryKey: ["available-projects"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Projets ajoutés au portefeuille avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout des projets:", error);
      toast.error("Erreur lors de l'ajout des projets");
    },
  });
};

export const useRemoveProjectFromPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectIds: string[]) => {
      const { error } = await supabase
        .from("projects")
        .update({ portfolio_id: null })
        .in("id", projectIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
      queryClient.invalidateQueries({ queryKey: ["available-projects"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Projets retirés du portefeuille avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression des projets:", error);
      toast.error("Erreur lors de la suppression des projets");
    },
  });
};
