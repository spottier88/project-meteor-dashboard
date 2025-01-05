import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";
import { UserProfile, UserRoleData } from "@/types/user";
import { useState } from "react";
import { ProfileUpdateForm } from "./UserForm/ProfileUpdateForm";

export const UserInfo = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

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
      // First clear the session
      await supabase.auth.signOut();
      // Clear any local storage
      localStorage.clear();
      // Force a page reload to clear all state
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Even if there's an error, we should still redirect to login
      window.location.href = "/login";
    }
  };

  if (!user) return null;

  const displayName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email 
    : user.email;

  return (
    <div className="flex items-center justify-between p-4 mb-4 bg-secondary/20 rounded-lg">
      <div className="flex flex-col">
        <button 
          onClick={() => setIsUpdateFormOpen(true)}
          className="text-sm font-medium hover:underline text-left"
        >
          {displayName}
        </button>
        <span className="text-xs text-muted-foreground">
          {isAdmin ? "Administrateur" : "Chef de projet"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      {profile && (
        <ProfileUpdateForm
          isOpen={isUpdateFormOpen}
          onClose={() => setIsUpdateFormOpen(false)}
          currentFirstName={profile.first_name || ""}
          currentLastName={profile.last_name || ""}
          userId={user.id}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};