/**
 * @hook useIncompleteProfile
 * @description Hook pour gérer l'incitation à compléter le profil utilisateur.
 * Vérifie si le profil (nom, prénom, affectation) est complet et gère l'affichage
 * de la modale d'incitation avec option "me rappeler plus tard".
 */

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "./useUserPreferences";

interface ProfileCompletionStatus {
  hasFirstName: boolean;
  hasLastName: boolean;
  hasHierarchyAssignment: boolean;
  isComplete: boolean;
}

export const useIncompleteProfile = () => {
  const user = useUser();
  const { preferences, updatePreferences, isLoading: preferencesLoading } = useUserPreferences();
  const [isDismissed, setIsDismissed] = useState(false);

  // Récupération du profil utilisateur
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Récupération de l'affectation hiérarchique
  const { data: hierarchyAssignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ["userHierarchyAssignment", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_hierarchy_assignments")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Calcul du statut de complétion du profil
  const completionStatus: ProfileCompletionStatus = useMemo(() => {
    const hasFirstName = !!profile?.first_name?.trim();
    const hasLastName = !!profile?.last_name?.trim();
    const hasHierarchyAssignment = !!hierarchyAssignment?.id;
    
    return {
      hasFirstName,
      hasLastName,
      hasHierarchyAssignment,
      isComplete: hasFirstName && hasLastName && hasHierarchyAssignment,
    };
  }, [profile, hierarchyAssignment]);

  // Vérifie si le rappel a été différé et si la date est passée
  const isReminderDismissed = useMemo(() => {
    if (!preferences?.profile_reminder_dismissed_until) return false;
    const dismissedUntil = new Date(preferences.profile_reminder_dismissed_until);
    return dismissedUntil > new Date();
  }, [preferences?.profile_reminder_dismissed_until]);

  // Indique si la modale doit être affichée
  const shouldShowDialog = useMemo(() => {
    // Ne pas afficher si : chargement en cours, profil complet, rappel différé, ou manuellement fermé
    if (profileLoading || assignmentLoading || preferencesLoading) return false;
    if (completionStatus.isComplete) return false;
    if (isReminderDismissed) return false;
    if (isDismissed) return false;
    // Ne pas afficher si l'onboarding n'a pas encore été vu (scénario 2 gère ce cas)
    if (preferences && !preferences.has_seen_onboarding) return false;
    
    return true;
  }, [
    profileLoading, 
    assignmentLoading, 
    preferencesLoading, 
    completionStatus.isComplete, 
    isReminderDismissed, 
    isDismissed,
    preferences
  ]);

  // Fermer la modale sans rappel
  const dismissDialog = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Reporter le rappel de X jours
  const remindLater = useCallback((days: number = 1) => {
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + days);
    
    updatePreferences({
      profile_reminder_dismissed_until: dismissedUntil.toISOString(),
    });
    setIsDismissed(true);
  }, [updatePreferences]);

  // Réinitialiser pour forcer l'affichage (utile pour les tests)
  const resetReminder = useCallback(() => {
    updatePreferences({
      profile_reminder_dismissed_until: null,
    });
    setIsDismissed(false);
  }, [updatePreferences]);

  return {
    shouldShowDialog,
    completionStatus,
    isLoading: profileLoading || assignmentLoading || preferencesLoading,
    dismissDialog,
    remindLater,
    resetReminder,
    profile,
  };
};
