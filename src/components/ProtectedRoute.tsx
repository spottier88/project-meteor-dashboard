
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin, isLoading: isPermissionsLoading } = usePermissionsContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Réduire le délai d'attente pour les permissions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Augmenté légèrement pour laisser le temps aux hooks

    return () => clearTimeout(timer);
  }, []);

  // Vérifier les droits admin pour les routes admin uniquement
  useEffect(() => {
    if (!isLoading && !isPermissionsLoading) {
      const isAdminRoute = pathname.startsWith("/admin");
      if (isAdminRoute && !isAdmin) {
        navigate("/", { replace: true });
      }
    }
  }, [pathname, isAdmin, navigate, isLoading, isPermissionsLoading]);

  // Ne pas bloquer l'affichage pour les routes non-admin
  const isAdminRoute = pathname.startsWith("/admin");
  
  if (isAdminRoute && (isLoading || isPermissionsLoading)) {
    return <LoadingSpinner />;
  }

  // Pour les routes non-admin, afficher directement le contenu
  return <>{children}</>;
};
