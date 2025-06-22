
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error("Erreur lors de la vérification de session:", error);
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(!!session);
            console.log("Session initiale:", !!session, "Route:", window.location.pathname);
            
            // Si connecté et sur une page d'auth, rediriger vers l'accueil
            if (session && (window.location.pathname === '/login' || window.location.pathname === '/auth/callback')) {
              console.log("Redirection vers / depuis:", window.location.pathname);
              navigate("/", { replace: true });
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur inattendue lors de la vérification d'authentification:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Vérifier la session existante
    checkAuth();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("Auth state change:", event, !!session, "Route:", window.location.pathname);
        
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/login", { replace: true });
        } else if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
          setIsLoading(false);
          // Rediriger vers l'accueil après connexion réussie seulement si on est sur login
          if (window.location.pathname === '/login' || window.location.pathname === '/auth/callback') {
            console.log("Redirection post-connexion vers /");
            navigate("/", { replace: true });
          }
        } else if (event === 'TOKEN_REFRESHED') {
          setIsAuthenticated(!!session);
          setIsLoading(false);
        } else {
          setIsAuthenticated(!!session);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
