
/**
 * @hook useUserPreferences
 * @description Hook pour gérer les préférences utilisateur côté client.
 * Permet la lecture, mise à jour et cache des préférences avec React Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UserPreferences {
  id: string;
  user_id: string;
  open_projects_in_new_tab: boolean;
  points_visualization_mode: 'classic' | 'cookies';
  created_at: string;
  updated_at: string;
}

interface UserPreferencesInput {
  open_projects_in_new_tab?: boolean;
  points_visualization_mode?: 'classic' | 'cookies';
}

export const useUserPreferences = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des préférences utilisateur
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["userPreferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // Si aucune préférence n'existe, créer les préférences par défaut
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            open_projects_in_new_tab: false,
            points_visualization_mode: 'classic'
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return newPrefs as UserPreferences;
      }

      return data as UserPreferences;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour mettre à jour les préférences avec upsert
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferencesInput>) => {
      if (!user?.id) {
        throw new Error("Utilisateur non authentifié");
      }

      // Utiliser upsert pour éviter les doublons
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...updates
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalider le cache des préférences
      queryClient.invalidateQueries({ queryKey: ["userPreferences", user?.id] });
      
      toast({
        title: "Succès",
        description: "Vos préférences ont été mises à jour",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la mise à jour des préférences:", error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de vos préférences",
        variant: "destructive",
      });
    },
  });

  // Fonction helper pour mettre à jour les préférences
  const updatePreferences = (updates: Partial<UserPreferencesInput>) => {
    updatePreferencesMutation.mutate(updates);
  };

  // Fonction helper pour obtenir une préférence spécifique avec valeur par défaut
  const getPreference = (key: keyof UserPreferencesInput, defaultValue: any) => {
    if (!preferences) return defaultValue;
    return preferences[key] ?? defaultValue;
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    isUpdating: updatePreferencesMutation.isLoading,
    getPreference,
  };
};
