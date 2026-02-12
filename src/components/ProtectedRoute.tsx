
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
      // Nettoyer les anciennes données de navigation
      cleanupOldNavigationData();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si pas de session, sauvegarder l'URL actuelle si ce n'est pas une page d'authentification
        if (pathname !== '/login' && pathname !== '/auth/callback') {
          setRedirectUrl(pathname);
        }
        navigate("/login");
      }
      
      setSessionChecked(true);
    };

    initializeAuth();
  }, [navigate, pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ne rediriger vers login que si déconnexion explicite
      if (sessionChecked && !session && pathname !== '/login' && pathname !== '/auth/callback' && event === 'SIGNED_OUT') {
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
