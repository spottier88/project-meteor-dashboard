
import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";
import { UserProfile, UserRoleData } from "@/types/user";
import { ProfileForm } from "./profile/ProfileForm";
import { UserNotificationsDropdown } from "./notifications/UserNotificationsDropdown";
import { RequiredNotificationDialog } from "./notifications/RequiredNotificationDialog";

// Fonction pour nettoyer les cookies Supabase
const clearSupabaseCookies = () => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Supprimer tous les cookies liés à Supabase
    if (name.startsWith("sb-")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  }
};

export const UserInfo = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

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
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

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

  const isAdmin = userRoles?.some(role => role.role === "admin");

  const handleLogout = async () => {
    try {
      // Invalider le cache avant la déconnexion
      queryClient.clear();
      
      // Déconnecter l'utilisateur via Supabase
      await supabase.auth.signOut();
      
      // Nettoyer les cookies manuellement
      clearSupabaseCookies();
      
      console.log("Déconnexion effectuée, redirection vers login");
      
      // Forcer la navigation vers login
      window.location.href = "/login";
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
      
      // En cas d'erreur, forcer quand même la redirection
      window.location.href = "/login";
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 mb-4 bg-secondary/20 rounded-lg">
        <div 
          className="flex flex-col cursor-pointer hover:opacity-80"
          onClick={() => setIsProfileFormOpen(true)}
        >          
          <span className="text-sm font-medium">
            {profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}` 
              : user.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {isAdmin ? "Administrateur" : "Chef de projet"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserNotificationsDropdown />
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4 mr-2" />
              Administration
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      <ProfileForm
        isOpen={isProfileFormOpen}
        onClose={() => setIsProfileFormOpen(false)}
        profile={profile}
      />
      
      {/* Composant pour afficher les notifications obligatoires en popup */}
      <RequiredNotificationDialog />
    </>
  );
};
