
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
        // Ouvrir dans un nouvel onglet
        window.open(projectUrl, '_blank');
        
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
