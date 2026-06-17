/**
 * @hook useRatingPrompt
 * @description Détermine si la modale de relance d'évaluation de l'application
 * doit être affichée à l'utilisateur connecté, en tenant compte :
 * - de l'éventuelle évaluation déjà enregistrée (table `app_ratings`),
 * - de l'opt-out définitif (préférence utilisateur),
 * - de la date de prochaine relance (préférence utilisateur),
 * - du délai initial après création du compte,
 * - de la fréquence configurée par l'administrateur (`application_settings`).
 *
 * Expose également les actions `snooze()` (report d'une fréquence) et
 * `optOut()` (désactivation définitive).
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAppRating } from "./useAppRating";

const DEFAULT_INITIAL_DELAY_DAYS = 7;
const DEFAULT_FREQUENCY_DAYS = 30;

interface RatingPromptPreferences {
  rating_prompt_dismissed_until: string | null;
  rating_prompt_opted_out: boolean | null;
}

export const useRatingPrompt = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const { hasRated, isLoading: isRatingLoading } = useAppRating();

  // Réglages globaux (admin)
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["ratingPromptSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("key, value")
        .eq("type", "rating");
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((row) => map.set(row.key, row.value));
      return {
        initialDelayDays: parseInt(
          map.get("rating_prompt_initial_delay_days") ?? `${DEFAULT_INITIAL_DELAY_DAYS}`,
          10
        ),
        frequencyDays: parseInt(
          map.get("rating_prompt_frequency_days") ?? `${DEFAULT_FREQUENCY_DAYS}`,
          10
        ),
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  // Préférences utilisateur (snooze + opt-out)
  const { data: prefs, isLoading: isPrefsLoading } = useQuery({
    queryKey: ["ratingPromptPreferences", user?.id],
    queryFn: async (): Promise<RatingPromptPreferences | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rating_prompt_dismissed_until, rating_prompt_opted_out")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as RatingPromptPreferences) ?? {
        rating_prompt_dismissed_until: null,
        rating_prompt_opted_out: false,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation interne pour reporter ou désactiver
  const updatePromptPrefs = useMutation({
    mutationFn: async (updates: Partial<RatingPromptPreferences>) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, ...updates },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratingPromptPreferences", user?.id] });
    },
  });

  const isLoading = isRatingLoading || isSettingsLoading || isPrefsLoading;

  const shouldShowPrompt = useMemo(() => {
    if (isLoading) return false;
    if (!user) return false;
    if (hasRated) return false;
    if (prefs?.rating_prompt_opted_out) return false;

    const now = Date.now();

    // Délai initial après création du compte
    const accountCreatedAt = user.created_at ? new Date(user.created_at).getTime() : null;
    const initialDelayMs = (settings?.initialDelayDays ?? DEFAULT_INITIAL_DELAY_DAYS) * 86_400_000;
    if (accountCreatedAt && now < accountCreatedAt + initialDelayMs) return false;

    // Report
    if (prefs?.rating_prompt_dismissed_until) {
      const until = new Date(prefs.rating_prompt_dismissed_until).getTime();
      if (now < until) return false;
    }

    return true;
  }, [isLoading, user, hasRated, prefs, settings]);

  const snooze = () => {
    const days = settings?.frequencyDays ?? DEFAULT_FREQUENCY_DAYS;
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    updatePromptPrefs.mutate({ rating_prompt_dismissed_until: until });
  };

  const optOut = () => {
    updatePromptPrefs.mutate({ rating_prompt_opted_out: true });
  };

  const reset = () => {
    updatePromptPrefs.mutate({
      rating_prompt_opted_out: false,
      rating_prompt_dismissed_until: null,
    });
  };

  return {
    shouldShowPrompt,
    isLoading,
    snooze,
    optOut,
    reset,
    isUpdating: updatePromptPrefs.isPending,
  };
};
