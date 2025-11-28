import { useState, useCallback } from "react";
import { useUserPreferences } from "./useUserPreferences";

/**
 * Hook personnalisé pour gérer le tutoriel de prise en main (onboarding).
 * 
 * Gère l'affichage automatique du tutoriel pour les nouveaux utilisateurs,
 * l'ouverture manuelle, et le marquage comme "vu" pour ne plus l'afficher.
 * 
 * @returns {Object} État et fonctions pour gérer le tutoriel
 * @returns {boolean} isOpen - Indique si le tutoriel doit être affiché
 * @returns {boolean} isLoading - Indique si les préférences sont en cours de chargement
 * @returns {Function} openTutorial - Ouvre manuellement le tutoriel
 * @returns {Function} closeTutorial - Ferme le tutoriel (avec option "ne plus afficher")
 * @returns {Function} markAsSeen - Marque le tutoriel comme vu
 * @returns {Function} resetTutorial - Réinitialise pour revoir le tutoriel
 * @returns {boolean} hasSeenOnboarding - Indique si l'utilisateur a déjà vu le tutoriel
 */
export const useOnboarding = () => {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  
  // Vérifie si le tutoriel doit s'afficher automatiquement
  // (nouveau utilisateur qui n'a jamais vu le tutoriel)
  const shouldAutoShow = !isLoading && 
                         preferences && 
                         !preferences.has_seen_onboarding;
  
  // L'état final : affichage auto OU ouverture manuelle
  const isOpen = shouldAutoShow || isManuallyOpen;
  
  /**
   * Marque le tutoriel comme vu par l'utilisateur.
   * Enregistre la date/heure de visualisation et ferme le tutoriel.
   */
  const markAsSeen = useCallback(() => {
    updatePreferences({ 
      has_seen_onboarding: true,
      onboarding_seen_at: new Date().toISOString()
    });
    setIsManuallyOpen(false);
  }, [updatePreferences]);
  
  /**
   * Ouvre manuellement le tutoriel.
   * Utilisé lorsque l'utilisateur clique sur "Revoir le tutoriel".
   */
  const openTutorial = useCallback(() => {
    setIsManuallyOpen(true);
  }, []);
  
  /**
   * Ferme le tutoriel.
   * @param {boolean} dontShowAgain - Si true, marque le tutoriel comme vu définitivement
   */
  const closeTutorial = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      markAsSeen();
    }
    setIsManuallyOpen(false);
  }, [markAsSeen]);
  
  /**
   * Réinitialise le tutoriel pour permettre de le revoir.
   * Utilisé pour les tests ou si l'utilisateur veut revoir le tutoriel.
   */
  const resetTutorial = useCallback(() => {
    updatePreferences({ 
      has_seen_onboarding: false,
      onboarding_seen_at: null
    });
  }, [updatePreferences]);
  
  return {
    isOpen,
    isLoading,
    openTutorial,
    closeTutorial,
    markAsSeen,
    resetTutorial,
    hasSeenOnboarding: preferences?.has_seen_onboarding ?? false
  };
};
