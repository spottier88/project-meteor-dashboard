
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuthContext } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * Garde d'authentification optimisé
 * Utilise le contexte d'authentification partagé pour éviter les vérifications doubles
 * Gère les redirections de manière fluide
 */
export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isInitialized } = useAuthContext();
  const [hasRedirected, setHasRedirected] = useState(false);

  console.log("[AuthGuard] État:", { 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    currentPath: window.location.pathname 
  });

  useEffect(() => {
    // Attendre que l'état d'authentification soit initialisé
    if (!isInitialized) {
      return;
    }

    const currentPath = window.location.pathname;
    
    // Si l'utilisateur est connecté et sur une page d'auth, rediriger vers l'accueil
    if (isAuthenticated && (currentPath === '/login' || currentPath === '/auth/callback') && !hasRedirected) {
      console.log("[AuthGuard] Redirection utilisateur connecté vers /");
      setHasRedirected(true);
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate, hasRedirected]);

  // Afficher le spinner pendant l'initialisation
  if (!isInitialized || isLoading) {
    console.log("[AuthGuard] Affichage du spinner de chargement");
    return <LoadingSpinner />;
  }

  // Afficher le contenu approprié selon l'état d'authentification
  const shouldShowChildren = isAuthenticated;
  
  console.log("[AuthGuard] Décision d'affichage:", { 
    shouldShowChildren, 
    isAuthenticated 
  });

  return shouldShowChildren ? <>{children}</> : <>{fallback}</>;
};
