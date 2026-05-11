import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HierarchyPathAssignmentForm } from "@/components/manager/HierarchyPathAssignmentForm";
import { AssignmentsList } from "@/components/manager/AssignmentsList";
import { SuggestedHierarchyPathsCard } from "@/components/manager/SuggestedHierarchyPathsCard";
import { useSuggestedManagerPaths } from "@/hooks/useSuggestedManagerPaths";
import { HierarchyPath } from "@/types/user";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

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

  const { data: suggested } = useSuggestedManagerPaths(userId);

  // Invalidations communes après mutation
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["manager_path_assignments"] });
    queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["suggestedManagerPaths", userId] });
  };

  // Ajout simple d'un chemin
  const addAssignment = useMutation({
    mutationFn: async (pathId: string) => {
      const { error } = await supabase
        .from("manager_path_assignments")
        .insert([{ user_id: userId, path_id: pathId }]);
      if (error) {
        if (error.code === "23505") {
          throw new Error("Cette affectation existe déjà pour cet utilisateur.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Succès",
        description: "L'affectation a été ajoutée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout",
        variant: "destructive",
      });
    },
  });

  // Ajout en masse (silencieux sur les doublons)
  const addAssignmentsBulk = useMutation({
    mutationFn: async (pathIds: string[]) => {
      if (pathIds.length === 0) return { inserted: 0 };
      const rows = pathIds.map((path_id) => ({ user_id: userId, path_id }));
      // upsert pour ignorer naturellement les doublons (contrainte unique user_id+path_id)
      const { error, count } = await supabase
        .from("manager_path_assignments")
        .upsert(rows, {
          onConflict: "user_id,path_id",
          ignoreDuplicates: true,
          count: "exact",
        });
      if (error) throw error;
      return { inserted: count ?? pathIds.length };
    },
    onSuccess: ({ inserted }) => {
      invalidateAll();
      toast({
        title: "Succès",
        description: `${inserted} affectation(s) ajoutée(s)`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout en masse",
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
      invalidateAll();
      toast({
        title: "Succès",
        description: "L'affectation a été supprimée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    },
  });

  const deleteAllAssignments = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("manager_path_assignments")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Succès",
        description: "Toutes les affectations ont été supprimées",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression globale",
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

  const assignedPathIds = (assignments ?? []).map((a) => a.path_id);

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

          {/* Rappel contextuel : rôle + affectation directe */}
          {suggested && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {suggested.isManager ? (
                <Badge variant="default">Rôle : Manager</Badge>
              ) : (
                <Badge variant="destructive">Rôle Manager manquant</Badge>
              )}
              {suggested.directAssignments.length === 0 ? (
                <Badge variant="outline">Aucune affectation hiérarchique</Badge>
              ) : (
                suggested.directAssignments.map((d) => (
                  <Badge key={`${d.entity_type}-${d.entity_id}`} variant="secondary">
                    {d.path_string || `${d.entity_type}`}
                  </Badge>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        {/* Bloc de suggestions automatiques */}
        <SuggestedHierarchyPathsCard
          userId={userId!}
          onAddPath={(pathId) => addAssignment.mutate(pathId)}
          onAddPaths={(pathIds) => addAssignmentsBulk.mutate(pathIds)}
        />

        {/* Formulaire manuel (cas atypiques) */}
        <HierarchyPathAssignmentForm
          userId={userId!}
          onAssignmentAdd={(pathId) => addAssignment.mutate(pathId)}
          assignedPathIds={assignedPathIds}
          defaultPathId={suggested?.defaultPathId ?? null}
        />

        {/* Liste des affectations existantes + suppression en masse */}
        <div className="grid gap-2">
          {assignedPathIds.length > 0 && (
            <div className="flex justify-end">
              <AlertDialog
                open={confirmDeleteAllOpen}
                onOpenChange={setConfirmDeleteAllOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tout supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer toutes les affectations ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action retirera tous les droits hiérarchiques de
                      manager pour {profile.first_name} {profile.last_name}.
                      Elle est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAllAssignments.mutate()}
                    >
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          <AssignmentsList
            assignments={(assignments ?? []).map((a) => ({
              id: a.id,
              entity_type: "path",
              entity_details: {
                name: a.path.path_string,
              },
            }))}
            onAssignmentDelete={(id) => deleteAssignment.mutate(id)}
          />
        </div>
      </div>
    </div>
  );
};
