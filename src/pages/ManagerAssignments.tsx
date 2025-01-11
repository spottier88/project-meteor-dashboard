import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentForm } from "@/components/manager-assignments/AssignmentForm";
import { AssignmentList } from "@/components/manager-assignments/AssignmentList";

export const ManagerAssignments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-8 px-4">
        Chargement des données...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        Utilisateur non trouvé
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/users")}
          className="mb-4"
        >
          <Settings className="mr-2 h-4 w-4" />
          Retour à la gestion des utilisateurs
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des affectations
          </h1>
          <p className="text-muted-foreground">
            {profile.first_name} {profile.last_name}
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle affectation</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm
              userId={userId}
              onAssignmentAdded={() => {
                // Refresh assignments list
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affectations existantes</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentList
              userId={userId}
              onAssignmentDeleted={() => {
                // Refresh assignments list
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
