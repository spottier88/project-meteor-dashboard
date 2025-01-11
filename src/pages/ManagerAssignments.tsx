import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewAssignmentForm } from "@/components/manager/NewAssignmentForm";
import { AssignmentsList } from "@/components/manager/AssignmentsList";
import { ManagerAssignment } from "@/types/user";

export const ManagerAssignments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("Current userId:", userId); // Debug log

  // Fetch user profile
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

  // Fetch existing assignments with related data
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log("Fetching assignments for userId:", userId); // Debug log
      const { data, error } = await supabase
        .from("manager_assignments")
        .select(`
          *,
          poles (id, name),
          directions (id, name),
          services (id, name)
        `)
        .eq("user_id", userId);
      if (error) throw error;
      console.log("Fetched assignments:", data); // Debug log
      return data;
    },
    enabled: !!userId,
  });

  // Add assignment mutation
  const addAssignment = useMutation({
    mutationFn: async (assignment: Omit<ManagerAssignment, 'id' | 'created_at'>) => {
      console.log("Adding assignment:", assignment); // Debug log
      const { error } = await supabase
        .from("manager_assignments")
        .insert([assignment]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_assignments"] });
      toast({
        title: "Succès",
        description: "L'affectation a été ajoutée",
      });
    },
    onError: (error) => {
      console.error("Error adding assignment:", error); // Debug log
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'affectation",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log("Deleting assignment:", assignmentId); // Debug log
      const { error } = await supabase
        .from("manager_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_assignments"] });
      toast({
        title: "Succès",
        description: "L'affectation a été supprimée",
      });
    },
    onError: (error) => {
      console.error("Error deleting assignment:", error); // Debug log
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'affectation",
        variant: "destructive",
      });
    },
  });

  if (isLoadingProfile || isLoadingAssignments) {
    return <div className="container mx-auto py-8 px-4">Chargement des données...</div>;
  }

  if (!profile) {
    return <div className="container mx-auto py-8 px-4">Utilisateur non trouvé</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin/users")} className="mb-4">
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
        <NewAssignmentForm 
          userId={userId!} 
          onAssignmentAdd={(assignment) => addAssignment.mutate(assignment)} 
        />
        <AssignmentsList 
          assignments={assignments || []} 
          onAssignmentDelete={(id) => deleteAssignment.mutate(id)} 
        />
      </div>
    </div>
  );
};