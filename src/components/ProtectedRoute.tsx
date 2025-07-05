
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { checkNewTabNavigation, cleanupNewTabNavigation, cleanupOldNavigationData } from "@/utils/newTabNavigation";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isNewTabNavigation, setIsNewTabNavigation] = useState(false);
  const [newTabSyncAttempts, setNewTabSyncAttempts] = useState(0);
  const [showRetryOption, setShowRetryOption] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[ProtectedRoute] Initialisation de l\'authentification pour:', pathname);
      
      // Nettoyer les anciennes données de navigation
      cleanupOldNavigationData();
      
      // ÉTAPE 1 : Détecter IMMÉDIATEMENT si c'est une navigation nouvel onglet
      const newTabData = checkNewTabNavigation();
      
      if (newTabData) {
        console.log('[ProtectedRoute] Navigation nouvel onglet détectée - ID projet:', newTabData.projectId);
        console.log('[ProtectedRoute] URL cible:', newTabData.targetUrl);
        setIsNewTabNavigation(true);
        
        // ÉTAPE 2 : Mode "attente de synchronisation" - ne pas faire de vérification de session normale
        console.log('[ProtectedRoute] Passage en mode attente de synchronisation de session...');
        
        // Attendre la synchronisation de session avec retry amélioré
        const waitForSessionSync = async (maxAttempts = 5, delayMs = 800) => {
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`[ProtectedRoute] Tentative de synchronisation ${attempt}/${maxAttempts}`);
            setNewTabSyncAttempts(attempt);
            
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log('[ProtectedRoute] Session synchronisée avec succès!');
              console.log('[ProtectedRoute] Redirection vers:', newTabData.targetUrl);
              
              cleanupNewTabNavigation();
              
              // Vérifier qu'on n'est pas déjà sur la bonne page
              if (pathname !== newTabData.targetUrl) {
                navigate(newTabData.targetUrl, { replace: true });
              }
              
              setSessionChecked(true);
              return;
            }
            
            // Attendre avant la prochaine tentative
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
          
          // ÉTAPE 3 : Fallback de sécurité après échec de synchronisation
          console.error('[ProtectedRoute] Échec de la synchronisation de session après', maxAttempts, 'tentatives');
          setShowRetryOption(true);
        };
        
        waitForSessionSync();
        return; // Ne pas continuer le traitement normal
      }
      
      // Traitement normal pour les navigations classiques (non nouvel onglet)
      console.log('[ProtectedRoute] Navigation normale détectée');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[ProtectedRoute] Pas de session, sauvegarde URL et redirection login');
        // Si pas de session et que c'est une navigation normale
        if (pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('[ProtectedRoute] Sauvegarde de l\'URL pour redirection:', pathname);
          localStorage.setItem('redirectAfterLogin', pathname);
        }
        navigate("/login");
      } else {
        console.log('[ProtectedRoute] Session normale trouvée');
      }
      
      setSessionChecked(true);
    };

    initializeAuth();
  }, [navigate, pathname]);

  useEffect(() => {
    // Ne configurer le listener que si ce n'est pas une navigation nouvel onglet
    if (isNewTabNavigation) {
      console.log('[ProtectedRoute] Pas de listener auth pour navigation nouvel onglet');
      return;
    }

    console.log('[ProtectedRoute] Configuration du listener auth pour navigation normale');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Événement auth:', event, 'Session:', !!session);
      
      // Ne rediriger que si la session initiale a déjà été vérifiée
      if (sessionChecked && !session && pathname !== '/login' && pathname !== '/auth/callback') {
        console.log('[ProtectedRoute] Perte de session, redirection vers login');
        
        // Vérifier si ce n'est pas une navigation en nouvel onglet avant de sauvegarder l'URL
        const newTabData = checkNewTabNavigation();
        if (!newTabData && pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('[ProtectedRoute] Sauvegarde URL pour redirection (auth state change):', pathname);
          localStorage.setItem('redirectAfterLogin', pathname);
        }
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, pathname, sessionChecked, isNewTabNavigation]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && !isAdmin) {
      navigate("/");
    }
  }, [pathname, isAdmin, navigate]);

  // ÉTAPE 4 : Debugging amélioré - Affichage pendant la synchronisation des nouveaux onglets
  if (isNewTabNavigation && !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-xl font-bold">Synchronisation en cours...</h2>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ouverture du projet dans le nouvel onglet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tentative {newTabSyncAttempts}/5
            </p>
            
            {showRetryOption && (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-red-600">
                  La synchronisation de session a échoué
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      console.log('[ProtectedRoute] Retry manuel de la synchronisation');
                      setShowRetryOption(false);
                      setNewTabSyncAttempts(0);
                      // Relancer le processus
                      window.location.reload();
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => {
                      console.log('[ProtectedRoute] Retour manuel à l\'accueil');
                      cleanupNewTabNavigation();
                      navigate("/");
                    }}
                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Retourner à l'accueil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
