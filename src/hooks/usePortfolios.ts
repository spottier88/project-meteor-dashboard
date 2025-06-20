
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Portfolio, CreatePortfolioData, UpdatePortfolioData } from "@/types/portfolio";
import { toast } from "sonner";

export const usePortfolios = (userId?: string) => {
  return useQuery({
    queryKey: ["portfolios", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc('get_accessible_portfolios', {
        p_user_id: userId
      });

      if (error) throw error;
      return data as Portfolio[];
    },
    enabled: !!userId,
  });
};

export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolioData: CreatePortfolioData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("project_portfolios")
        .insert({
          ...portfolioData,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portefeuille créé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la création du portefeuille:", error);
      toast.error("Erreur lors de la création du portefeuille");
    },
  });
};

export const useUpdatePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePortfolioData) => {
      const { data, error } = await supabase
        .from("project_portfolios")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portefeuille mis à jour avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du portefeuille:", error);
      toast.error("Erreur lors de la mise à jour du portefeuille");
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolioId: string) => {
      const { error } = await supabase
        .from("project_portfolios")
        .delete()
        .eq("id", portfolioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portefeuille supprimé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du portefeuille:", error);
      toast.error("Erreur lors de la suppression du portefeuille");
    },
  });
};
