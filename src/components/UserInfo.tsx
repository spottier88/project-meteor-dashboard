
/**
 * @component UserInfo
 * @description Affiche les informations de l'utilisateur connecté et gère la déconnexion.
 * Permet d'accéder au profil utilisateur, aux notifications système et à la documentation.
 * Affiche les badges d'administrateur et de chef de projet selon les rôles de l'utilisateur.
 * Gère également la logique de nettoyage des cookies lors de la déconnexion.
 */

import { useState, useEffect } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, AlertCircle, BookOpen } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";
import { UserProfile, UserRoleData } from "@/types/user";
import { ProfileForm } from "./profile/ProfileForm";
import { UserNotificationsDropdown } from "./notifications/UserNotificationsDropdown";
import { RequiredNotificationDialog } from "./notifications/RequiredNotificationDialog";
import { HelpButton } from "@/components/help/HelpButton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const clearSupabaseCookies = () => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    if (name.startsWith("sb-")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  }
};

interface UserInfoProps {
  onOpenTutorial?: () => void;
}

export const UserInfo = ({ onOpenTutorial }: UserInfoProps) => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { hasAdminRole, isAdmin, adminRoleDisabled, toggleAdminRole } = usePermissionsContext();

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

  // Supprimé car maintenant géré par le contexte

  const handleLogout = async () => {
    try {
      // console.log("Début de la procédure de déconnexion");
      
      queryClient.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      clearSupabaseCookies();
      
      // console.log("Déconnexion effectuée avec succès, redirection vers login");
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      
      clearSupabaseCookies();
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
      
      window.location.href = "/login";
    }
  };
  
  const handleCloseProfileForm = () => {
    setIsProfileFormOpen(false);
    // Forcer le rechargement du contexte de permissions
    queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    queryClient.invalidateQueries({ queryKey: ["accessibleOrganizations"] });
    // Actualiser les affectations hiérarchiques pour mettre à jour le badge
    queryClient.invalidateQueries({ queryKey: ["hierarchyAssignments"] });
    
    // Incrémenter la clé de rafraîchissement pour forcer une requête
    setRefreshKey(prev => prev + 1);
  };

  const { data: hierarchyAssignments } = useQuery({
    queryKey: ["hierarchyAssignments", profile?.id, refreshKey],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: assignments, error } = await supabase
        .from("user_hierarchy_assignments")
        .select("id, entity_type, entity_id")
        .eq("user_id", profile.id);

      if (error) throw error;

      return assignments;
    },
    enabled: !!profile?.id,
    staleTime: 0, // Ne pas utiliser le cache
  });

  const isProfileIncomplete = (profile?: UserProfile | null): boolean => {
    if (!profile) return true;
    if (!profile.first_name || !profile.last_name) return true;
    
    // Vérifier si l'utilisateur a une affectation hiérarchique
    return !hierarchyAssignments || hierarchyAssignments.length === 0;
  };

  if (!user) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 mb-4 bg-secondary/20 rounded-lg">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
          onClick={() => setIsProfileFormOpen(true)}
        >          
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : user.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {hasAdminRole ? (isAdmin ? "Administrateur" : "Administrateur (désactivé)") : "Chef de projet"}
            </span>
          </div>
          
          {isProfileIncomplete(profile) && (
            <div className="flex items-center text-amber-500" title="Informations de profil incomplètes">
              <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500">
                <AlertCircle className="h-3 w-3" />
                Profil incomplet
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <UserNotificationsDropdown />
          <HelpButton />
          
          {hasAdminRole && (
            <div className="flex items-center gap-2 px-3 py-1 border rounded-lg bg-background">
              <span className="text-xs font-medium">Mode admin</span>
              <Switch
                checked={!adminRoleDisabled}
                onCheckedChange={() => toggleAdminRole()}
              />
            </div>
          )}
          
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4 mr-2" />
              Administration
            </Button>
          )}
          {onOpenTutorial && (
            <Button variant="ghost" size="sm" onClick={onOpenTutorial} title="Revoir le tutoriel de prise en main">
              <BookOpen className="h-4 w-4 mr-2" />
              Tutoriel
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
        onClose={handleCloseProfileForm}
        profile={profile}
      />
      
      <RequiredNotificationDialog />
    </>
  );
};
