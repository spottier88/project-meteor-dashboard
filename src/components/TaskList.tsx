
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/task/TaskForm";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { TaskTable } from "./task/TaskTable";
import { Input } from "@/components/ui/input";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskGantt } from "@/components/task/TaskGantt";
import { useTaskPermissions } from "@/hooks/use-task-permissions";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
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

export interface TaskListProps {
  projectId: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
}

export const TaskList = ({
  projectId,
  canEdit,
  isProjectManager,
  isAdmin,
}: TaskListProps) => {
  const { toast } = useToast();
  const { isManager } = usePermissionsContext();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const queryClient = useQueryClient();

  const { canCreateTask, canEditTask, canDeleteTask } = useTaskPermissions(projectId);

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log(`Récupération de ${data?.length || 0} tâches pour le projet ${projectId}`);
      return data;
    },
  });

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La tâche a été supprimée",
      });

      refetch();
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

  const filteredTasks = tasks?.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.assignee?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tâches</h3>
        {canCreateTask && (
          <Button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskFormOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <ViewToggle currentView={view} onViewChange={setView} />
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {tasks && tasks.length > 0 ? (
        view === "table" ? (
          <TaskTable
            tasks={filteredTasks || []}
            onEdit={(task) => {
              if (canEditTask(task.assignee)) {
                setSelectedTask(task);
                setIsTaskFormOpen(true);
              }
            }}
            onDelete={task => {
              if (canDeleteTask) {
                setTaskToDelete(task);
              }
            }}
          />
        ) : view === "grid" ? (
          <KanbanBoard
            projectId={projectId}
            readOnly={!canCreateTask}
            onEditTask={(task) => {
              if (canEditTask(task.assignee)) {
                setSelectedTask(task);
                setIsTaskFormOpen(true);
              }
            }}
          />
        ) : (
          <TaskGantt
            tasks={filteredTasks || []}
            projectId={projectId}
            readOnly={!canCreateTask}
            onEditTask={(task) => {
              if (canEditTask(task.assignee)) {
                setSelectedTask(task);
                setIsTaskFormOpen(true);
              }
            }}
          />
        )
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Aucune tâche pour ce projet
        </div>
      )}

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={refetch}
        projectId={projectId}
        task={selectedTask}
        readOnlyFields={!canCreateTask}
      />

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La tâche sera définitivement supprimée.
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
    </div>
  );
};
