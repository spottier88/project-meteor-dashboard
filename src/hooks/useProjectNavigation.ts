
/**
 * @hook useProjectNavigation
 * @description Hook pour gérer la navigation vers les projets selon les préférences utilisateur.
 * Détermine si les projets doivent s'ouvrir dans un nouvel onglet ou dans l'onglet actuel.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useUserPreferences } from "./useUserPreferences";

// F-10 : TTL (60 s) appliqué aux entrées sessionStorage liées à l'ouverture
// d'un projet dans un nouvel onglet, pour éviter l'accumulation de clés orphelines
// si le nouvel onglet est fermé immédiatement ou ne consomme jamais la clé.
const NAV_KEY_PREFIX = "project_navigation_";
const NAV_KEY_TTL_MS = 60_000;

const cleanupExpiredNavKeys = () => {
  try {
    const now = Date.now();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith(NAV_KEY_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        sessionStorage.removeItem(key);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as { timestamp?: number };
        if (!parsed.timestamp || now - parsed.timestamp > NAV_KEY_TTL_MS) {
          sessionStorage.removeItem(key);
        }
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // sessionStorage indisponible (mode privé strict) — ignorer silencieusement
  }
};

export const useProjectNavigation = () => {
  const navigate = useNavigate();
  const { getPreference } = useUserPreferences();

  const navigateToProject = useCallback(
    (projectId: string, event?: React.MouseEvent) => {
      const openInNewTab = getPreference('open_projects_in_new_tab', false);
      const projectUrl = `/projects/${projectId}`;

      if (openInNewTab) {
        // F-10 : purger les clés expirées avant d'en écrire une nouvelle
        cleanupExpiredNavKeys();

        const newTabKey = `${NAV_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const navigationData = {
          projectId,
          targetUrl: projectUrl,
          timestamp: Date.now()
        };

        sessionStorage.setItem(newTabKey, JSON.stringify(navigationData));

        const fullUrl = `${window.location.origin}${projectUrl}?newTab=${newTabKey}`;
        const newWindow = window.open(fullUrl, '_blank');

        if (!newWindow) {
          console.warn('Le navigateur a bloqué l\'ouverture du nouvel onglet');
          // Fallback : navigation normale + nettoyage de la clé inutilisée
          sessionStorage.removeItem(newTabKey);
          void navigate(projectUrl);
        }

        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
      } else {
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

