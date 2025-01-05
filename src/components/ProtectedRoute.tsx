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

  const { data: userRoles } = useQuery({
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
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    const isAdmin = userRoles?.some(role => role.role === "admin");

    if (isAdminRoute && !isAdmin) {
      navigate("/");
    }
  }, [pathname, userRoles, navigate]);

  if (!user) return null;

  return <>{children}</>;
};