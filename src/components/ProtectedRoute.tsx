import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { isAdmin } = usePermissionsContext();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && !isAdmin) {
      navigate("/");
    }
  }, [pathname, isAdmin, navigate]);

  return <>{children}</>;
};