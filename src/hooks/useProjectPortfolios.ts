/**
 * Hook pour récupérer les portefeuilles auxquels un projet est assigné
 * Permet de gérer la relation N:M entre projets et portefeuilles
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@supabase/auth-helpers-react";

export interface ProjectPortfolio {
  id: string;
  portfolio_id: string;
  portfolio_name: string;
  portfolio_status: string | null;
  added_at: string;
}

/**
 * Récupère les portefeuilles d'un projet donné
 */
export const useProjectPortfolios = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-portfolios", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("portfolio_projects")
        .select(`
          id,
          portfolio_id,
          added_at,
          portfolio:project_portfolios(name, status)
        `)
        .eq("project_id", projectId);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        portfolio_id: item.portfolio_id,
        portfolio_name: item.portfolio?.name || "",
        portfolio_status: item.portfolio?.status || null,
        added_at: item.added_at
      })) as ProjectPortfolio[];
    },
    enabled: !!projectId,
  });
};

/**
 * Ajoute un projet à un portefeuille
 */
export const useAddProjectToPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async ({ projectId, portfolioId }: { projectId: string; portfolioId: string }) => {
      const { error } = await supabase
        .from("portfolio_projects")
        .insert({
          project_id: projectId,
          portfolio_id: portfolioId,
          added_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-portfolios", projectId] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      
      toast({
        title: "Succès",
        description: "Le projet a été ajouté au portefeuille",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de l'ajout au portefeuille:", error);
      // Vérifier si c'est une erreur de doublon
      if (error?.code === "23505") {
        toast({
          title: "Information",
          description: "Le projet est déjà dans ce portefeuille",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'ajout au portefeuille",
          variant: "destructive",
        });
      }
    },
  });
};

/**
 * Retire un projet d'un portefeuille spécifique
 */
export const useRemoveProjectFromPortfolioLink = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, portfolioId }: { projectId: string; portfolioId: string }) => {
      const { error } = await supabase
        .from("portfolio_projects")
        .delete()
        .eq("project_id", projectId)
        .eq("portfolio_id", portfolioId);

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-portfolios", projectId] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      
      toast({
        title: "Succès",
        description: "Le projet a été retiré du portefeuille",
      });
    },
    onError: (error) => {
      console.error("Erreur lors du retrait du portefeuille:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait du portefeuille",
        variant: "destructive",
      });
    },
  });
};

/**
 * Met à jour les portefeuilles d'un projet (ajoute/retire selon la sélection)
 */
export const useUpdateProjectPortfolios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      portfolioIds,
      currentPortfolioIds 
    }: { 
      projectId: string; 
      portfolioIds: string[];
      currentPortfolioIds: string[];
    }) => {
      // Calculer les portefeuilles à ajouter et à retirer
      const toAdd = portfolioIds.filter(id => !currentPortfolioIds.includes(id));
      const toRemove = currentPortfolioIds.filter(id => !portfolioIds.includes(id));

      // Ajouter les nouveaux
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("portfolio_projects")
          .insert(toAdd.map(portfolioId => ({
            project_id: projectId,
            portfolio_id: portfolioId,
            added_by: user?.id
          })));

        if (insertError) throw insertError;
      }

      // Retirer les anciens
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("portfolio_projects")
          .delete()
          .eq("project_id", projectId)
          .in("portfolio_id", toRemove);

        if (deleteError) throw deleteError;
      }

      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: (result, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-portfolios", projectId] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des portefeuilles:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des portefeuilles",
        variant: "destructive",
      });
    },
  });
};
