/**
 * @file MyTasksKanban.tsx
 * @description Vue Kanban multi-projets pour la page "Mes tâches".
 * Affiche les tâches en 3 colonnes (À faire / En cours / Terminé)
 * avec lien vers le projet et changement rapide de statut.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, FileText, ClipboardCheck } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface MyTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string | null;
  start_date?: string | null;
  document_url?: string | null;
  completion_comment?: string | null;
  projects?: {
    id: string;
    title: string;
  } | null;
}

interface MyTasksKanbanProps {
  tasks: MyTask[];
  onEdit: (task: MyTask) => void;
}

const statusOrder: Array<"todo" | "in_progress" | "done"> = ["todo", "in_progress", "done"];

const columns = [
  { id: "todo" as const, title: "À faire", color: "bg-yellow-100 text-yellow-800" },
  { id: "in_progress" as const, title: "En cours", color: "bg-blue-100 text-blue-800" },
  { id: "done" as const, title: "Terminé", color: "bg-green-100 text-green-800" },
];

export const MyTasksKanban = ({ tasks, onEdit }: MyTasksKanbanProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Changement rapide de statut
  const changeStatus = async (taskId: string, direction: "next" | "prev") => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const idx = statusOrder.indexOf(task.status);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= statusOrder.length) return;

    const { error } = await supabase
      .from("tasks")
      .update({ status: statusOrder[newIdx] })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de changer le statut", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    }
  };

  // Vérifier si une tâche est en retard
  const isOverdue = (task: MyTask) => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.due_date) < today;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="space-y-3">
            {/* En-tête de colonne */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">{col.title}</h3>
              <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
            </div>

            {/* Cartes */}
            <div className="space-y-2 min-h-[100px]">
              {colTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onEdit(task)}
                >
                  {/* Nom du projet (lien) */}
                  {task.projects?.id && (
                    <Link
                      to={`/project/${task.projects.id}`}
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.projects.title}
                    </Link>
                  )}

                  {/* Titre de la tâche */}
                  <p className="text-sm font-medium mt-1 flex items-center gap-1">
                    {task.title}
                    {task.document_url && <FileText className="h-3 w-3 text-primary" />}
                    {task.completion_comment && <ClipboardCheck className="h-3 w-3 text-green-600" />}
                  </p>

                  {/* Date d'échéance */}
                  {task.due_date && (
                    <p className={cn(
                      "text-xs mt-1",
                      isOverdue(task) ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                      {new Date(task.due_date).toLocaleDateString("fr-FR")}
                    </p>
                  )}

                  {/* Boutons de changement de statut */}
                  <div className="flex justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    {col.id !== "todo" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStatus(task.id, "prev")}>
                        <ArrowLeft className="h-3 w-3" />
                      </Button>
                    )}
                    {col.id !== "done" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStatus(task.id, "next")}>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
