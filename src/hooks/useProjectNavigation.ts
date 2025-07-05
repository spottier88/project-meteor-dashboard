
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
        // Marquer dans sessionStorage que nous ouvrons un projet spécifique
        const newTabKey = `project_navigation_${Date.now()}`;
        sessionStorage.setItem(newTabKey, JSON.stringify({
          projectId,
          targetUrl: projectUrl,
          timestamp: Date.now()
        }));
        
        // Construire l'URL complète avec le paramètre pour identifier la navigation en nouvel onglet
        const fullUrl = `${window.location.origin}${projectUrl}?newTab=${newTabKey}`;
        
        // Ouvrir dans un nouvel onglet avec l'URL complète
        const newWindow = window.open(fullUrl, '_blank');
        
        // Vérifier si le nouvel onglet s'est ouvert correctement
        if (!newWindow) {
          console.warn('Le navigateur a bloqué l\'ouverture du nouvel onglet');
          // Fallback : navigation normale
          navigate(projectUrl);
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
