
import { useUserPreferences } from "./useUserPreferences";

export const useProjectNavigation = () => {
  const { preferences } = useUserPreferences();

  const navigateToProject = (projectId: string, navigate?: (path: string) => void) => {
    const projectUrl = `/project/${projectId}`;
    
    if (preferences.open_projects_in_new_tab) {
      // Ouvrir dans un nouvel onglet
      window.open(projectUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Navigation normale dans le même onglet
      if (navigate) {
        navigate(projectUrl);
      } else {
        window.location.href = projectUrl;
      }
    }
  };

  return {
    navigateToProject,
    shouldOpenInNewTab: preferences.open_projects_in_new_tab,
  };
};
