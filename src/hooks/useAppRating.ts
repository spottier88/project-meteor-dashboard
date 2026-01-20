/**
 * @hook useAppRating
 * @description Hook pour gérer l'évaluation de l'application par l'utilisateur connecté
 * Permet de récupérer, créer ou mettre à jour l'évaluation de l'utilisateur
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { AppRating } from "@/types/rating";

export const useAppRating = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer l'évaluation existante de l'utilisateur
  const { data: userRating, isLoading } = useQuery({
    queryKey: ["appRating", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("app_ratings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AppRating | null;
    },
    enabled: !!user?.id,
  });

  // Mutation pour créer ou mettre à jour l'évaluation
  const submitRating = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      // Upsert : créer ou mettre à jour
      const { data, error } = await supabase
        .from("app_ratings")
        .upsert(
          {
            user_id: user.id,
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appRating", user?.id] });
      toast({
        title: "Merci pour votre avis !",
        description: "Votre évaluation a été enregistrée avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'envoi de l'évaluation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre évaluation.",
        variant: "destructive",
      });
    },
  });

  return {
    userRating,
    isLoading,
    hasRated: !!userRating,
    submitRating: submitRating.mutate,
    isSubmitting: submitRating.isPending,
  };
};
