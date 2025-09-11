/**
 * @file TaskStatusUpdateSection.tsx
 * @description Composant permettant de mettre à jour les statuts des tâches lors de la création d'une revue de projet.
 * Affiche la liste des tâches du projet avec la possibilité de modifier leur statut.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Clock } from "lucide-react";

// Types pour les statuts des tâches
type TaskStatus = "todo" | "in_progress" | "done";

export interface TaskStatusUpdate {
  id: string;
  title: string;
  currentStatus: TaskStatus;
  newStatus: TaskStatus;
}

interface TaskStatusUpdateSectionProps {
  projectId: string;
  onTaskStatusesChange: (taskStatusUpdates: TaskStatusUpdate[]) => void;
  disabled?: boolean;
}

export const TaskStatusUpdateSection = ({ 
  projectId, 
  onTaskStatusesChange, 
  disabled = false 
}: TaskStatusUpdateSectionProps) => {
  const [taskStatusUpdates, setTaskStatusUpdates] = useState<TaskStatusUpdate[]>([]);

  // Récupération des tâches du projet
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["project-tasks-for-review", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Initialiser les états des tâches
  useEffect(() => {
    if (tasks) {
      const initialStatusUpdates: TaskStatusUpdate[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        currentStatus: task.status as TaskStatus,
        newStatus: task.status as TaskStatus,
      }));
      setTaskStatusUpdates(initialStatusUpdates);
    }
  }, [tasks]);

  // Notifier les changements au parent
  useEffect(() => {
    onTaskStatusesChange(taskStatusUpdates);
  }, [taskStatusUpdates, onTaskStatusesChange]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTaskStatusUpdates(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, newStatus }
          : task
      )
    );
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "todo":
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "Terminée";
      case "in_progress":
        return "En cours";
      case "todo":
      default:
        return "À faire";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mise à jour des tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Chargement des tâches...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mise à jour des tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Aucune tâche à mettre à jour pour ce projet.</div>
        </CardContent>
      </Card>
    );
  }

  // Compter les tâches qui ont changé de statut
  const changedTasks = taskStatusUpdates.filter(task => task.currentStatus !== task.newStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Mise à jour des tâches
          {changedTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {changedTasks.length} modifiée(s)
            </Badge>
          )}
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          Mettez à jour le statut des tâches pour refléter l'avancement actuel du projet.
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {taskStatusUpdates.map((task, index) => (
          <div key={task.id}>
            <div className="flex items-center justify-between space-x-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{task.title}</div>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(task.currentStatus)}
                  <span className="text-xs text-muted-foreground">
                    Actuellement : {getStatusLabel(task.currentStatus)}
                  </span>
                  {task.currentStatus !== task.newStatus && (
                    <>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge className={`text-xs ${getStatusColor(task.newStatus)}`}>
                        {getStatusLabel(task.newStatus)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Select
                  value={task.newStatus}
                  onValueChange={(value: TaskStatus) => handleStatusChange(task.id, value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">
                      <div className="flex items-center space-x-2">
                        <Circle className="h-4 w-4 text-gray-400" />
                        <span>À faire</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>En cours</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="done">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Terminée</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {index < taskStatusUpdates.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};