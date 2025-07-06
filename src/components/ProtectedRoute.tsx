
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { setRedirectUrl, cleanupOldNavigationData } from "@/utils/redirectionUtils";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[ProtectedRoute] Initialisation de l\'authentification pour:', pathname);
      
      // Nettoyer les anciennes données de navigation
      cleanupOldNavigationData();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[ProtectedRoute] Pas de session, sauvegarde URL et redirection login');
        // Si pas de session, sauvegarder l'URL actuelle si ce n'est pas une page d'authentification
        if (pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('[ProtectedRoute] Sauvegarde de l\'URL pour redirection:', pathname);
          setRedirectUrl(pathname);
        }
        navigate("/login");
      } else {
        console.log('[ProtectedRoute] Session trouvée, utilisateur authentifié');
      }
      
      setSessionChecked(true);
    };

    initializeAuth();
  }, [navigate, pathname]);

  useEffect(() => {
    console.log('[ProtectedRoute] Configuration du listener auth');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Événement auth:', event, 'Session:', !!session);
      
      // Ne rediriger vers login que si :
      // 1. La session initiale a déjà été vérifiée
      // 2. Il n'y a pas de session
      // 3. Nous ne sommes pas déjà sur une page d'authentification
      // 4. L'événement est SIGNED_OUT (déconnexion explicite)
      if (sessionChecked && !session && pathname !== '/login' && pathname !== '/auth/callback' && event === 'SIGNED_OUT') {
        console.log('[ProtectedRoute] Perte de session (SIGNED_OUT), redirection vers login');
        
        // Sauvegarder l'URL actuelle pour redirection après reconnexion
        console.log('[ProtectedRoute] Sauvegarde URL pour redirection (auth state change):', pathname);
        setRedirectUrl(pathname);
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, pathname, sessionChecked]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && !isAdmin) {
      navigate("/");
    }
  }, [pathname, isAdmin, navigate]);

  return <>{children}</>;
};
