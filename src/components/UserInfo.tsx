import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const UserInfo = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-between p-4 mb-4 bg-secondary/20 rounded-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.email}</span>
        <span className="text-xs text-muted-foreground">
          {profile?.role === "admin" ? "Administrateur" : "Chef de projet"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {profile?.role === "admin" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/users")}
          >
            <Users className="h-4 w-4 mr-2" />
            Gérer les utilisateurs
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};