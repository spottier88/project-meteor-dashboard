
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
    // Vérifier la session existante au chargement
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
      
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Vérifier les droits admin après que l'authentification soit établie
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isAdminRoute = pathname.startsWith("/admin");
      if (isAdminRoute && !isAdmin) {
        navigate("/");
      }
    }
  }, [pathname, isAdmin, navigate, isLoading, isAuthenticated]);

  // Afficher le spinner pendant le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    navigate("/login");
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
