
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
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
        
        console.log("Auth state change:", event, !!session);
        
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
          setIsLoading(false);
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
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
