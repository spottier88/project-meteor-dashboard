import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@supabase/auth-helpers-react";
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
  };
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  showActions: boolean;
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

export const TaskCard = ({ task, onEdit, onDelete, showActions }: TaskCardProps) => {
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(d => d.role);
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isTaskOverdue = () => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  const canEditTask = () => {
    if (!user || !userProfile) return false;
    
    // Les admins peuvent tout modifier
    if (userRoles?.includes("admin")) return true;
    
    // Les chefs de projet peuvent tout modifier
    if (userRoles?.includes("chef_projet")) return true;
    
    // Les membres ne peuvent modifier que leurs tâches assignées
    return task.assignee === userProfile.email;
  };

  const canDeleteTask = () => {
    if (!user) return false;
    
    // Seuls les admins et chefs de projet peuvent supprimer
    return userRoles?.includes("admin") || userRoles?.includes("chef_projet");
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell className="max-w-md">{task.description || "-"}</TableCell>
      <TableCell>
        <span className={statusColors[task.status]}>
          {statusLabels[task.status]}
        </span>
      </TableCell>
      <TableCell>{task.assignee || "-"}</TableCell>
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
            {canEditTask() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDeleteTask() && (
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