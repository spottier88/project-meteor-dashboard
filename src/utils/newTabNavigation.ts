
/**
 * @utils newTabNavigation
 * @description Utilitaires pour gérer la navigation en nouveaux onglets avec synchronisation de session
 */

interface NewTabNavigationData {
  projectId: string;
  targetUrl: string;
  timestamp: number;
}

/**
 * Vérifie si la page actuelle a été ouverte dans un nouvel onglet pour un projet spécifique
 */
export const checkNewTabNavigation = (): NewTabNavigationData | null => {
  // Vérifier les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const newTabKey = urlParams.get('newTab');
  
  if (!newTabKey) {
    return null;
  }
  
  // Récupérer les données de navigation depuis sessionStorage
  const navigationData = sessionStorage.getItem(newTabKey);
  
  if (!navigationData) {
    return null;
  }
  
  try {
    const data: NewTabNavigationData = JSON.parse(navigationData);
    
    // Vérifier que les données ne sont pas trop anciennes (5 minutes max)
    const maxAge = 5 * 60 * 1000; // 5 minutes en millisecondes
    if (Date.now() - data.timestamp > maxAge) {
      sessionStorage.removeItem(newTabKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la lecture des données de navigation:', error);
    sessionStorage.removeItem(newTabKey);
    return null;
  }
};

/**
 * Nettoie les données de navigation après utilisation
 */
export const cleanupNewTabNavigation = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const newTabKey = urlParams.get('newTab');
  
  if (newTabKey) {
    sessionStorage.removeItem(newTabKey);
    
    // Nettoyer l'URL sans recharger la page
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }
};

/**
 * Nettoie les anciennes données de navigation (plus de 5 minutes)
 */
export const cleanupOldNavigationData = () => {
  const maxAge = 5 * 60 * 1000; // 5 minutes
  const currentTime = Date.now();
  
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('project_navigation_')) {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}');
        if (data.timestamp && (currentTime - data.timestamp > maxAge)) {
          sessionStorage.removeItem(key);
        }
      } catch (error) {
        // Si on ne peut pas parser, on supprime la clé
        sessionStorage.removeItem(key);
      }
    }
  });
};

/**
 * Attend la synchronisation de session entre onglets
 */
export const waitForSessionSync = (timeout: number = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkSession = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    };
    
    const startTime = Date.now();
    
    const intervalCheck = setInterval(async () => {
      const hasSession = await checkSession();
      
      if (hasSession || (Date.now() - startTime) > timeout) {
        clearInterval(intervalCheck);
        resolve(hasSession);
      }
    }, 200); // Vérifier toutes les 200ms
  });
};
