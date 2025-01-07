import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";
import { UserProfile, UserRoleData } from "@/types/user";
import { ProfileForm } from "./profile/ProfileForm";

export const UserInfo = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        toast({
          title: "Déconnexion réussie",
          description: "Vous avez été déconnecté avec succès",
        });
      } else {
        throw new Error("La session n'a pas été correctement terminée");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
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
              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {isAdmin ? "Administrateur" : "Chef de projet"}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
    </>
  );
};
