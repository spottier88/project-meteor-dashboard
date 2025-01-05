import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserRoleData } from "@/types/user";
import { useUser } from "@supabase/auth-helpers-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const user = useUser();
  const pathname = window.location.pathname;

  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    const isAdmin = userRoles?.some(role => role.role === "admin");

    if (isAdminRoute && !isAdmin && !isLoadingRoles) {
      navigate("/");
    }
  }, [pathname, userRoles, navigate, isLoadingRoles]);

  if (!user) {
    return null;
  }

  if (isLoadingRoles) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return <>{children}</>;
};