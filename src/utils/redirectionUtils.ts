
/**
 * @utils redirectionUtils
 * @description Utilitaires pour gérer les redirections de manière unifiée avec sessionStorage uniquement
 */

interface NewTabNavigationData {
  projectId: string;
  targetUrl: string;
  timestamp: number;
}

/**
 * Vérifie et récupère l'URL de redirection à utiliser
 * Priorité : navigation nouvel onglet > redirection normale
 */
export const getRedirectUrl = (): string | null => {
  try {
    // Vérifier d'abord si c'est une navigation nouvel onglet
    const urlParams = new URLSearchParams(window.location.search);
    const newTabKey = urlParams.get('newTab');
    
    if (newTabKey) {
      console.log('[redirectionUtils] Détection paramètre newTab:', newTabKey);
      
      const navigationData = sessionStorage.getItem(newTabKey);
      if (navigationData) {
        try {
          const data: NewTabNavigationData = JSON.parse(navigationData);
          
          // Vérifier que les données ne sont pas expirées (10 minutes max)
          const maxAge = 10 * 60 * 1000;
          const age = Date.now() - data.timestamp;
          
          if (age <= maxAge) {
            console.log('[redirectionUtils] URL de redirection nouvel onglet:', data.targetUrl);
            return data.targetUrl;
          } else {
            console.warn('[redirectionUtils] Données nouvel onglet expirées, suppression');
            sessionStorage.removeItem(newTabKey);
          }
        } catch (error) {
          console.error('[redirectionUtils] Erreur parsing données nouvel onglet:', error);
          sessionStorage.removeItem(newTabKey);
        }
      }
    }
    
    // Vérifier ensuite s'il y a une redirection normale stockée
    const normalRedirect = sessionStorage.getItem('redirectAfterLogin');
    if (normalRedirect && normalRedirect !== '/login' && normalRedirect !== '/auth/callback') {
      console.log('[redirectionUtils] URL de redirection normale:', normalRedirect);
      return normalRedirect;
    }
    
    console.log('[redirectionUtils] Aucune URL de redirection trouvée');
    return null;
  } catch (error) {
    console.error('[redirectionUtils] Erreur lors de la récupération de l\'URL de redirection:', error);
    return null;
  }
};

/**
 * Stocke une URL de redirection normale dans sessionStorage
 */
export const setRedirectUrl = (url: string) => {
  try {
    if (url && url !== '/login' && url !== '/auth/callback') {
      console.log('[redirectionUtils] Sauvegarde URL de redirection:', url);
      sessionStorage.setItem('redirectAfterLogin', url);
    }
  } catch (error) {
    console.error('[redirectionUtils] Erreur lors de la sauvegarde de l\'URL de redirection:', error);
  }
};

/**
 * Supprime l'URL de redirection normale du sessionStorage
 */
export const clearRedirectUrl = () => {
  try {
    sessionStorage.removeItem('redirectAfterLogin');
    console.log('[redirectionUtils] URL de redirection normale supprimée');
  } catch (error) {
    console.error('[redirectionUtils] Erreur lors de la suppression de l\'URL de redirection:', error);
  }
};

/**
 * Effectue la redirection post-authentification
 */
export const performPostAuthRedirect = (navigate: (url: string) => void) => {
  const redirectUrl = getRedirectUrl();
  
  if (redirectUrl) {
    // Nettoyer les données de redirection
    clearRedirectUrl();
    
    // Nettoyer les données de navigation nouvel onglet si présentes
    const urlParams = new URLSearchParams(window.location.search);
    const newTabKey = urlParams.get('newTab');
    if (newTabKey) {
      sessionStorage.removeItem(newTabKey);
      // Nettoyer l'URL sans recharger la page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    
    console.log('[redirectionUtils] Redirection vers:', redirectUrl);
    navigate(redirectUrl);
  } else {
    console.log('[redirectionUtils] Redirection vers la page d\'accueil');
    navigate('/');
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
      console.log('[redirectionUtils] Nettoyage de', cleanedCount, 'anciennes données de navigation');
    }
  } catch (error) {
    console.error('[redirectionUtils] Erreur lors du nettoyage des anciennes données:', error);
  }
};
