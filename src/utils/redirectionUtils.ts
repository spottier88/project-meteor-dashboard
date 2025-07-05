
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
 * Vérifie et récupère l'URL de redirection à utiliser SANS nettoyer les données
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
            console.warn('[redirectionUtils] Données nouvel onglet expirées');
            return null;
          }
        } catch (error) {
          console.error('[redirectionUtils] Erreur parsing données nouvel onglet:', error);
          return null;
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
 * Nettoie les données de navigation nouvel onglet après utilisation
 */
export const clearNewTabRedirection = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const newTabKey = urlParams.get('newTab');
    
    if (newTabKey) {
      sessionStorage.removeItem(newTabKey);
      console.log('[redirectionUtils] Données nouvel onglet supprimées:', newTabKey);
      
      // Nettoyer l'URL sans recharger la page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      console.log('[redirectionUtils] URL nettoyée');
    }
  } catch (error) {
    console.error('[redirectionUtils] Erreur lors du nettoyage nouvel onglet:', error);
  }
};

/**
 * Effectue la redirection post-authentification avec nettoyage approprié
 */
export const performPostAuthRedirect = (navigate: (url: string) => void) => {
  const redirectUrl = getRedirectUrl();
  
  if (redirectUrl) {
    console.log('[redirectionUtils] Redirection vers:', redirectUrl);
    
    // Nettoyer les données appropriées selon le type de redirection
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('newTab')) {
      // C'est une navigation nouvel onglet, nettoyer ces données
      clearNewTabRedirection();
    } else {
      // C'est une redirection normale, nettoyer ces données
      clearRedirectUrl();
    }
    
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
