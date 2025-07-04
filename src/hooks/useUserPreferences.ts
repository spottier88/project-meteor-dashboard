
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferences {
  id: string;
  user_id: string;
  open_projects_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les préférences utilisateur
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["userPreferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserPreferences | null;
    },
    enabled: !!user?.id,
  });

  // Mutation pour créer ou mettre à jour les préférences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<Pick<UserPreferences, 'open_projects_in_new_tab'>>) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      if (preferences) {
        // Mise à jour
        const { data, error } = await supabase
          .from("user_preferences")
          .update(newPreferences)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Création
        const { data, error } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            ...newPreferences,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences", user?.id] });
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences ont été sauvegardées avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des préférences:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
      });
    },
  });

  const updatePreferences = (newPreferences: Partial<Pick<UserPreferences, 'open_projects_in_new_tab'>>) => {
    updatePreferencesMutation.mutate(newPreferences);
  };

  // Valeurs par défaut si aucune préférence n'est définie
  const currentPreferences = preferences || {
    open_projects_in_new_tab: false,
  };

  return {
    preferences: currentPreferences,
    isLoading,
    updatePreferences,
    isUpdating: updatePreferencesMutation.isLoading,
  };
};
