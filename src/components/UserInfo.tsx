import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";

export const UserInfo = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    try {
      // Effectuer la déconnexion
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Attendre un court instant pour s'assurer que la session est bien terminée
      await new Promise(resolve => setTimeout(resolve, 100));

      // Vérifier que la session est bien terminée
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Session terminée avec succès, rediriger vers la page de connexion
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