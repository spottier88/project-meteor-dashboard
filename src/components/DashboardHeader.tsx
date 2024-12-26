import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

export function DashboardHeader({ onNewProject, onNewReview }: DashboardHeaderProps) {
  const navigate = useNavigate();
  
  const { data: profile } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "direction":
        return "Direction";
      case "chef_projet":
        return "Chef de projet";
      case "direction_operationnelle":
        return "Direction opérationnelle";
      default:
        return "Utilisateur";
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Gérez vos projets et suivez leur avancement
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 mr-4 border-r pr-4">
          <Avatar>
            <AvatarFallback>
              {getInitials(profile?.first_name, profile?.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(profile?.role)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => navigate("/users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
          )}
          <Button variant="outline" onClick={onNewReview}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle revue
          </Button>
          <Button onClick={onNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}