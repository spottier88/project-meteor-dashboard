
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler un délai pour laisser le temps aux permissions de se charger
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Vérifier les droits admin pour les routes admin
  useEffect(() => {
    if (!isLoading) {
      const isAdminRoute = pathname.startsWith("/admin");
      if (isAdminRoute && !isAdmin) {
        navigate("/", { replace: true });
      }
    }
  }, [pathname, isAdmin, navigate, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
