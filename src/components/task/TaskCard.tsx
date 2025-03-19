
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskPermissions } from "@/hooks/use-task-permissions";
import { formatUserName } from "@/utils/formatUserName";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    assignee?: string;
    due_date?: string;
    project_id: string;
    projects?: {
      id: string;
      title: string;
    };
  };
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  showActions?: boolean;
}

const statusColors = {
  todo: "text-yellow-600",
  in_progress: "text-blue-600",
  done: "text-green-600",
};

const statusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export const TaskCard = ({ task, onEdit, onDelete, showActions = true }: TaskCardProps) => {
  const { canEditTask, canDeleteTask } = useTaskPermissions(task.project_id);

  // Récupérer les profils pour formater l'affichage du nom
  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", task.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", task.project_id);

      if (error) throw error;
      
      // Récupérer aussi le chef de projet
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", task.project_id)
        .maybeSingle();
      
      if (project?.project_manager) {
        const { data: pmProfile } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("email", project.project_manager)
          .maybeSingle();
          
        if (pmProfile) {
          // Vérifier que le chef de projet n'est pas déjà dans la liste
          const isAlreadyInList = data?.some(m => m.profiles?.email === pmProfile.email);
          if (!isAlreadyInList) {
            data?.push({
              user_id: pmProfile.id,
              profiles: pmProfile
            });
          }
        }
      }
      
      return data || [];
    },
    enabled: !!task.project_id,
  });

  // Extraire les profils pour les passer à formatUserName
  const profiles = projectMembers?.map(member => member.profiles) || [];

  const isTaskOverdue = () => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {task.projects?.title || "-"}
      </TableCell>
      <TableCell>{task.title}</TableCell>
      <TableCell className="max-w-md">{task.description || "-"}</TableCell>
      <TableCell>
        <span className={statusColors[task.status]}>
          {statusLabels[task.status]}
        </span>
      </TableCell>
      <TableCell>
        <span className={cn(
          isTaskOverdue() ? "text-red-600 font-medium" : ""
        )}>
          {task.due_date
            ? new Date(task.due_date).toLocaleDateString("fr-FR")
            : "-"}
        </span>
      </TableCell>
      <TableCell>
        {showActions && (
          <div className="flex items-center gap-2">
            {canEditTask(task.assignee) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDeleteTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};
