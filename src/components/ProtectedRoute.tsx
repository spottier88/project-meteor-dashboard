
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            navigate("/login", { replace: true });
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/login", { replace: true });
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Vérifier les droits admin pour les routes admin
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const isAdminRoute = pathname.startsWith("/admin");
      if (isAdminRoute && !isAdmin) {
        navigate("/", { replace: true });
      }
    }
  }, [pathname, isAdmin, navigate, isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
