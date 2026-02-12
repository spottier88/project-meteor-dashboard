
/**
 * @hook useProjectNavigation
 * @description Hook pour gérer la navigation vers les projets selon les préférences utilisateur.
 * Détermine si les projets doivent s'ouvrir dans un nouvel onglet ou dans l'onglet actuel.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "./useUserPreferences";

export const useProjectNavigation = () => {
  const navigate = useNavigate();
  const { getPreference } = useUserPreferences();

  const navigateToProject = useCallback(
    (projectId: string, event?: React.MouseEvent) => {
      const openInNewTab = getPreference('open_projects_in_new_tab', false);
      const projectUrl = `/projects/${projectId}`;

      if (openInNewTab) {
        // Créer une clé unique pour cette navigation
        const newTabKey = `project_navigation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Stocker les données de navigation dans sessionStorage
        const navigationData = {
          projectId,
          targetUrl: projectUrl,
          timestamp: Date.now()
        };
        
        sessionStorage.setItem(newTabKey, JSON.stringify(navigationData));
        
        // Construire l'URL complète avec le paramètre pour identifier la navigation en nouvel onglet
        const fullUrl = `${window.location.origin}${projectUrl}?newTab=${newTabKey}`;
        
        // Ouverture du projet dans un nouvel onglet
        
        // Ouvrir dans un nouvel onglet avec l'URL complète
        const newWindow = window.open(fullUrl, '_blank');
        
        // Vérifier si le nouvel onglet s'est ouvert correctement
        if (!newWindow) {
          console.warn('Le navigateur a bloqué l\'ouverture du nouvel onglet');
          // Fallback : navigation normale
          navigate(projectUrl);
          // Nettoyer les données stockées
          sessionStorage.removeItem(newTabKey);
        }
        
        // Empêcher la navigation par défaut si c'est un clic
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
      } else {
        // Navigation normale dans l'onglet actuel
        navigate(projectUrl);
      }
    },
    [navigate, getPreference]
  );

  return {
    navigateToProject,
    openInNewTab: getPreference('open_projects_in_new_tab', false),
  };
};
