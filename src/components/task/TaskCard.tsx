import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isTaskOverdue = () => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};