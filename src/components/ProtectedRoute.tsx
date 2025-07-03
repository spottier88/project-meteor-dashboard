

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Sauvegarder l'URL seulement si l'utilisateur n'est pas authentifié
        // et que ce n'est pas déjà la page de login
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ne rediriger que si la session initiale a déjà été vérifiée
      // et éviter les redirections multiples
      if (sessionChecked && !session && pathname !== '/login' && pathname !== '/auth/callback') {
        if (pathname !== '/login' && pathname !== '/auth/callback') {
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

