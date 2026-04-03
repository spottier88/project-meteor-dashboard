
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { setRedirectUrl, cleanupOldNavigationData } from "@/utils/redirectionUtils";
import { resetInteractionLocks } from "@/utils/resetInteractionLocks";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin } = usePermissionsContext();
  const [sessionChecked, setSessionChecked] = useState(false);

  // Refs pour éviter les re-exécutions des effects lors des changements de route
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(pathname);

  // Synchroniser les refs à chaque render sans déclencher d'effects
  useEffect(() => {
    navigateRef.current = navigate;
    pathnameRef.current = pathname;
  });

  // Effect 1 : vérification initiale de la session, une seule fois au montage
  useEffect(() => {
    const initializeAuth = async () => {
      cleanupOldNavigationData();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const p = pathnameRef.current;
        if (p !== '/login' && p !== '/auth/callback') {
          setRedirectUrl(p);
        }
        navigateRef.current("/login");
      }
      
      setSessionChecked(true);
    };

    initializeAuth();
  }, []); // Montage uniquement — les refs couvrent les valeurs dynamiques

  // Effect 2 : listener auth, monté une seule fois
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === 'SIGNED_OUT') {
        const p = pathnameRef.current;
        if (p !== '/login' && p !== '/auth/callback') {
          setRedirectUrl(p);
        }
        navigateRef.current("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Montage uniquement — évite de recréer l'abonnement à chaque navigation

  // Effect 3 : nettoyage des verrous d'interaction à chaque changement de route
  useEffect(() => {
    resetInteractionLocks();
  }, [pathname]);

  // Effect 4 : vérification des routes admin (synchrone, pas d'interférence)
  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && !isAdmin) {
      void navigate("/");
    }
  }, [pathname, isAdmin, navigate]);

  return <>{children}</>;
};
