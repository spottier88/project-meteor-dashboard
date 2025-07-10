
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface PortfolioManager {
  id: string;
  user_id: string;
  portfolio_id: string;
  role: string;
  created_at: string;
  user_profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export const usePortfolioManagers = (portfolioId: string) => {
  return useQuery({
    queryKey: ["portfolio-managers", portfolioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_managers")
        .select(`
          id,
          user_id,
          portfolio_id,
          role,
          created_at,
          profiles!portfolio_managers_user_id_fkey(
            email,
            first_name,
            last_name
          )
        `)
        .eq("portfolio_id", portfolioId);

      if (error) throw error;
      
      // Transformer les données pour correspondre à l'interface
      return data.map(item => ({
        ...item,
        user_profile: item.profiles
      })) as PortfolioManager[];
    },
    enabled: !!portfolioId,
  });
};

export const useAddPortfolioManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      portfolioId, 
      userId, 
      role = "manager" 
    }: { 
      portfolioId: string; 
      userId: string; 
      role?: string; 
    }) => {
      const { error } = await supabase
        .from("portfolio_managers")
        .insert({
          portfolio_id: portfolioId,
          user_id: userId,
          role: role,
        });

      if (error) throw error;
    },
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-managers", portfolioId] });
      toast({
        title: "Succès",
        description: "Gestionnaire ajouté avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout du gestionnaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du gestionnaire",
        variant: "destructive",
      });
    },
  });
};

export const useRemovePortfolioManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ managerId }: { managerId: string }) => {
      const { error } = await supabase
        .from("portfolio_managers")
        .delete()
        .eq("id", managerId);

      if (error) throw error;
    },
    onSuccess: (_, { managerId }) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-managers"] });
      toast({
        title: "Succès",
        description: "Gestionnaire supprimé avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du gestionnaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du gestionnaire",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePortfolioManagerRole = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      managerId, 
      role 
    }: { 
      managerId: string; 
      role: string; 
    }) => {
      const { error } = await supabase
        .from("portfolio_managers")
        .update({ role })
        .eq("id", managerId);

      if (error) throw error;
    },
    onSuccess: (_, { managerId }) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-managers"] });
      toast({
        title: "Succès",
        description: "Rôle mis à jour avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle",
        variant: "destructive",
      });
    },
  });
};
