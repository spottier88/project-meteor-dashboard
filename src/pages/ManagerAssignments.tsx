import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewAssignmentForm } from "@/components/manager/NewAssignmentForm";
import { AssignmentsList } from "@/components/manager/AssignmentsList";
import { ManagerAssignment, ManagerAssignmentWithDetails, EntityType } from "@/types/user";

export const ManagerAssignments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: assignmentsData, error } = await supabase
        .from("manager_assignments")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const detailedAssignments = await Promise.all(
        assignmentsData.map(async (assignment) => {
          const tableName = `${assignment.entity_type}s` as "poles" | "directions" | "services";
          const { data: entityData } = await supabase
            .from(tableName)
            .select("name")
            .eq("id", assignment.entity_id)
            .maybeSingle();

          return {
            ...assignment,
            entity_details: entityData || { name: 'Unknown' }
          } as ManagerAssignmentWithDetails;
        })
      );

      return detailedAssignments;
    },
    enabled: !!userId,
  });

  const addAssignment = useMutation({
    mutationFn: async (assignment: Omit<ManagerAssignment, 'id' | 'created_at'>) => {
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
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'affectation",
        variant: "destructive",
      });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
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
    onError: () => {
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