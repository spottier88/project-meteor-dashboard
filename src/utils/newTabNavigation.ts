
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
  try {
    // Vérifier les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    const newTabKey = urlParams.get('newTab');
    
    console.log('[newTabNavigation] Vérification paramètre newTab:', newTabKey);
    
    if (!newTabKey) {
      return null;
    }
    
    // Récupérer les données de navigation depuis sessionStorage
    const navigationData = sessionStorage.getItem(newTabKey);
    console.log('[newTabNavigation] Données récupérées depuis sessionStorage:', !!navigationData);
    
    if (!navigationData) {
      console.warn('[newTabNavigation] Aucune donnée trouvée pour la clé:', newTabKey);
      return null;
    }
    
    const data: NewTabNavigationData = JSON.parse(navigationData);
    console.log('[newTabNavigation] Données parsées:', data);
    
    // Vérifier que les données ne sont pas trop anciennes (10 minutes max)
    const maxAge = 10 * 60 * 1000; // 10 minutes en millisecondes
    const age = Date.now() - data.timestamp;
    
    if (age > maxAge) {
      console.warn('[newTabNavigation] Données expirées (âge:', age, 'ms), suppression');
      sessionStorage.removeItem(newTabKey);
      return null;
    }
    
    console.log('[newTabNavigation] Navigation nouvel onglet validée pour projet:', data.projectId);
    return data;
  } catch (error) {
    console.error('[newTabNavigation] Erreur lors de la lecture des données de navigation:', error);
    return null;
  }
};

/**
 * Nettoie les données de navigation après utilisation
 */
export const cleanupNewTabNavigation = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const newTabKey = urlParams.get('newTab');
    
    console.log('[newTabNavigation] Nettoyage pour clé:', newTabKey);
    
    if (newTabKey) {
      sessionStorage.removeItem(newTabKey);
      console.log('[newTabNavigation] Données supprimées du sessionStorage');
      
      // Nettoyer l'URL sans recharger la page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      console.log('[newTabNavigation] URL nettoyée:', cleanUrl);
    }
  } catch (error) {
    console.error('[newTabNavigation] Erreur lors du nettoyage:', error);
  }
};

/**
 * Nettoie les anciennes données de navigation (plus de 10 minutes)
 */
export const cleanupOldNavigationData = () => {
  try {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const currentTime = Date.now();
    let cleanedCount = 0;
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('project_navigation_')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (data.timestamp && (currentTime - data.timestamp > maxAge)) {
            sessionStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Si on ne peut pas parser, on supprime la clé
          sessionStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      console.log('[newTabNavigation] Nettoyage de', cleanedCount, 'anciennes données de navigation');
    }
  } catch (error) {
    console.error('[newTabNavigation] Erreur lors du nettoyage des anciennes données:', error);
  }
};

/**
 * Attend la synchronisation de session entre onglets avec retry amélioré
 */
export const waitForSessionSync = async (timeout: number = 5000, maxRetries: number = 3): Promise<boolean> => {
  for (let retry = 0; retry < maxRetries; retry++) {
    console.log(`[newTabNavigation] Tentative de synchronisation ${retry + 1}/${maxRetries}`);
    
    const result = await new Promise<boolean>((resolve) => {
      const checkSession = async () => {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: { session } } = await supabase.auth.getSession();
          return !!session;
        } catch (error) {
          console.error('[newTabNavigation] Erreur lors de la vérification de session:', error);
          return false;
        }
      };
      
      const startTime = Date.now();
      
      const intervalCheck = setInterval(async () => {
        const hasSession = await checkSession();
        const elapsed = Date.now() - startTime;
        
        if (hasSession) {
          console.log('[newTabNavigation] Session trouvée après', elapsed, 'ms');
          clearInterval(intervalCheck);
          resolve(true);
        } else if (elapsed > timeout) {
          console.warn('[newTabNavigation] Timeout après', elapsed, 'ms');
          clearInterval(intervalCheck);
          resolve(false);
        }
      }, 200); // Vérifier toutes les 200ms
    });
    
    if (result) {
      return true;
    }
    
    // Attendre avant le prochain retry
    if (retry < maxRetries - 1) {
      console.log('[newTabNavigation] Attente avant nouveau retry...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('[newTabNavigation] Échec de la synchronisation après', maxRetries, 'tentatives');
  return false;
};
