
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

  useEffect(() => {
    const checkInitialSession = async () => {
      // Nettoyer les anciennes données de navigation
      cleanupOldNavigationData();
      
      // Vérifier si c'est une navigation en nouvel onglet AVANT tout
      const newTabData = checkNewTabNavigation();
      
      if (newTabData) {
        console.log('Navigation en nouvel onglet détectée pour le projet:', newTabData.projectId);
        setIsNewTabNavigation(true);
        
        // Pour les nouveaux onglets, attendre un délai pour la synchronisation de session
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Session trouvée, nettoyer et rester sur la page cible
            console.log('Session synchronisée pour le nouvel onglet, redirection vers:', newTabData.targetUrl);
            cleanupNewTabNavigation();
            
            // Vérifier si nous sommes déjà sur la bonne page
            if (pathname !== newTabData.targetUrl) {
              navigate(newTabData.targetUrl, { replace: true });
            }
          } else {
            // Pas de session même après attente, rediriger vers login
            console.log('Aucune session trouvée après synchronisation, redirection vers login');
            cleanupNewTabNavigation();
            navigate("/login");
          }
          setSessionChecked(true);
        }, 1000); // Délai de 1 seconde pour la synchronisation
        
        return; // Ne pas continuer le traitement normal
      }
      
      // Traitement normal pour les navigations classiques
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si pas de session et que c'est une navigation normale
        if (pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('Sauvegarde de l\'URL pour redirection:', pathname);
          localStorage.setItem('redirectAfterLogin', pathname);
        }
        navigate("/login");
      }
      setSessionChecked(true);
    };

    checkInitialSession();
  }, [navigate, pathname]);

  useEffect(() => {
    // Ne configurer le listener que si ce n'est pas une navigation nouvel onglet
    if (isNewTabNavigation) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ne rediriger que si la session initiale a déjà été vérifiée
      // et éviter les redirections multiples
      if (sessionChecked && !session && pathname !== '/login' && pathname !== '/auth/callback') {
        // Vérifier si ce n'est pas une navigation en nouvel onglet avant de sauvegarder l'URL
        const newTabData = checkNewTabNavigation();
        if (!newTabData && pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('Sauvegarde de l\'URL pour redirection (auth state change):', pathname);
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

  // Afficher un indicateur de chargement pendant la synchronisation des nouveaux onglets
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
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
