import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task } from "./kanban/types";
import { KanbanColumn } from "./kanban/KanbanColumn";
import { Card, CardContent } from "./ui/card";

interface KanbanBoardProps {
  projectId: string;
}

const columns = [
  { id: "todo" as const, title: "À faire" },
  { id: "in_progress" as const, title: "En cours" },
  { id: "done" as const, title: "Terminé" },
];

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // Add error handling for undefined projectId
  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Identifiant du projet manquant
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("owner_id, project_manager")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId, // Only run query if projectId exists
  });

  const { data: tasks, refetch, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId, // Only run query if projectId exists
  });

  // Show loading state
  if (isLoadingProject || isLoadingTasks) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Chargement du tableau Kanban...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      refetch();
      toast({
        title: "Succès",
        description: "Le statut de la tâche a été mis à jour",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      refetch();
      toast({
        title: "Succès",
        description: "La tâche a été supprimée",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks || []}
            onStatusChange={handleStatusChange}
            onEdit={(task) => {
              setSelectedTask(task);
              setIsTaskFormOpen(true);
            }}
            onDelete={setTaskToDelete}
            projectOwnerId={project?.owner_id}
            projectManagerEmail={project?.project_manager}
          />
        ))}
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={refetch}
        projectId={projectId}
        task={selectedTask || undefined}
      />

      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={() => setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La tâche sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};