import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HierarchyPathAssignmentForm } from "@/components/manager/HierarchyPathAssignmentForm";
import { AssignmentsList } from "@/components/manager/AssignmentsList";
import { HierarchyPath } from "@/types/user";
import { useEffect } from "react";

interface ManagerPathAssignmentWithDetails {
  id: string;
  path_id: string;
  path: HierarchyPath;
}

export const ManagerAssignments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleNavigateBack = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["lastLogins"] });
    queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
    navigate("/admin/users");
  };

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["lastLogins"] });
      queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
    };
  }, [queryClient]);

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
    queryKey: ["manager_path_assignments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: assignmentsData, error } = await supabase
        .from("manager_path_assignments")
        .select(`
          id,
          path_id,
          path:hierarchy_paths (*)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return assignmentsData as ManagerPathAssignmentWithDetails[];
    },
    enabled: !!userId,
  });

  const addAssignment = useMutation({
    mutationFn: async (pathId: string) => {
      const { error } = await supabase
        .from("manager_path_assignments")
        .insert([{ user_id: userId, path_id: pathId }]);
      if (error) {
        if (error.code === '23505') {
          throw new Error("Cette affectation existe déjà pour cet utilisateur.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_path_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Succès",
        description: "L'affectation a été ajoutée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'affectation",
        variant: "destructive",
      });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("manager_path_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_path_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
        <Button variant="ghost" onClick={handleNavigateBack} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à la gestion des utilisateurs
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des affectations hiérarchiques
          </h1>
          <p className="text-muted-foreground">
            {profile.first_name} {profile.last_name}
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <HierarchyPathAssignmentForm 
          userId={userId!} 
          onAssignmentAdd={(pathId) => addAssignment.mutate(pathId)} 
        />
        <AssignmentsList 
          assignments={assignments.map(a => ({
            id: a.id,
            entity_type: 'path',
            entity_details: {
              name: a.path.path_string
            }
          }))} 
          onAssignmentDelete={(id) => deleteAssignment.mutate(id)} 
        />
      </div>
    </div>
  );
};
