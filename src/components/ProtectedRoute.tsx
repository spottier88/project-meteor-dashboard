
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

  useEffect(() => {
    const checkInitialSession = async () => {
      // Nettoyer les anciennes données de navigation
      cleanupOldNavigationData();
      
      // Vérifier si c'est une navigation en nouvel onglet
      const newTabData = checkNewTabNavigation();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si pas de session et que c'est une navigation normale (pas un nouvel onglet)
        if (!newTabData && pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('Sauvegarde de l\'URL pour redirection:', pathname);
          localStorage.setItem('redirectAfterLogin', pathname);
        }
        navigate("/login");
      } else {
        // Session valide
        if (newTabData) {
          // Si c'est un nouvel onglet, nettoyer les paramètres et rester sur la page cible
          console.log('Navigation en nouvel onglet détectée pour le projet:', newTabData.projectId);
          cleanupNewTabNavigation();
          // La page est déjà la bonne grâce à l'URL construite dans useProjectNavigation
        }
      }
      setSessionChecked(true);
    };

    checkInitialSession();
  }, [navigate, pathname]);

  useEffect(() => {
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
  }, [navigate, pathname, sessionChecked]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && !isAdmin) {
      navigate("/");
    }
  }, [pathname, isAdmin, navigate]);

  return <>{children}</>;
};
