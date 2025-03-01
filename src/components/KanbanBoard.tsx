import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTaskPermissions } from "@/hooks/use-task-permissions";
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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee?: string;
  due_date?: string;
  start_date?: string;
  project_id: string;
  parent_task_id?: string;
}

interface KanbanBoardProps {
  projectId: string;
  readOnly?: boolean;
  onEditTask?: (task: any) => void;
}

export const KanbanBoard = ({ projectId, readOnly = false, onEditTask }: KanbanBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const { canEditTask, canDeleteTask } = useTaskPermissions(projectId);

  const { data: taskData, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (taskData) {
      setTasks(taskData);
    }
  }, [taskData]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La tâche a été supprimée",
      });
      
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "À faire";
      case "in_progress":
        return "En cours";
      case "done":
        return "Terminé";
      default:
        return status;
    }
  };

  const isTaskOverdue = (task: any) => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const parentTasks = tasks.filter(task => !task.parent_task_id);
  const childTasksByParent: Record<string, Task[]> = {};
  
  tasks.forEach(task => {
    if (task.parent_task_id) {
      if (!childTasksByParent[task.parent_task_id]) {
        childTasksByParent[task.parent_task_id] = [];
      }
      childTasksByParent[task.parent_task_id].push(task);
    }
  });

  const columns = [
    { id: "todo", title: "À faire" },
    { id: "in_progress", title: "En cours" },
    { id: "done", title: "Terminé" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              {column.title}
            </h3>
            <div className="space-y-4">
              {parentTasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <div key={task.id} className="space-y-2">
                    <Card className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {task.id in childTasksByParent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 mr-1 p-0"
                              onClick={() => toggleTaskExpanded(task.id)}
                            >
                              {expandedTasks[task.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <h4 className="font-semibold">{task.title}</h4>
                          {task.id in childTasksByParent && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {childTasksByParent[task.id].length} sous-tâche(s)
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.assignee && (
                        <p className="text-sm text-muted-foreground">
                          Assigné à : {task.assignee}
                        </p>
                      )}
                      {task.start_date && (
                        <p className="text-sm text-muted-foreground">
                          Début : {new Date(task.start_date).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {task.due_date && (
                        <p className={cn(
                          "text-sm",
                          isTaskOverdue(task) ? "text-red-600 font-medium" : "text-muted-foreground"
                        )}>
                          Échéance : {new Date(task.due_date).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {!readOnly && (
                        <div className="flex items-center justify-end gap-2 pt-2">
                          {canEditTask(task.assignee) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditTask?.(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteTask && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTaskToDelete(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                    
                    {task.id in childTasksByParent && expandedTasks[task.id] && (
                      <div className="pl-4 space-y-2 border-l-2 border-gray-200 ml-2">
                        {childTasksByParent[task.id]
                          .filter(childTask => childTask.status === column.id)
                          .map(childTask => (
                            <Card key={childTask.id} className="p-4 space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{childTask.title}</h4>
                                <Badge variant="secondary" className={getStatusColor(childTask.status)}>
                                  {getStatusLabel(childTask.status)}
                                </Badge>
                              </div>
                              {childTask.description && (
                                <p className="text-sm text-muted-foreground">{childTask.description}</p>
                              )}
                              {childTask.assignee && (
                                <p className="text-sm text-muted-foreground">
                                  Assigné à : {childTask.assignee}
                                </p>
                              )}
                              {childTask.start_date && (
                                <p className="text-sm text-muted-foreground">
                                  Début : {new Date(childTask.start_date).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                              {childTask.due_date && (
                                <p className={cn(
                                  "text-sm",
                                  isTaskOverdue(childTask) ? "text-red-600 font-medium" : "text-muted-foreground"
                                )}>
                                  Échéance : {new Date(childTask.due_date).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                              {!readOnly && (
                                <div className="flex items-center justify-end gap-2 pt-2">
                                  {canEditTask(childTask.assignee) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onEditTask?.(childTask)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDeleteTask && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setTaskToDelete(childTask.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </Card>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer définitivement la tâche.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
