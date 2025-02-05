import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useTaskPermissions } from "@/hooks/use-task-permissions";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee?: string;
  due_date?: string;
  start_date?: string;
  project_id: string;
}

interface TaskTableProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

const statusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export const TaskTable = ({ tasks, onEdit, onDelete }: TaskTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { canEditTask, canDeleteTask } = useTaskPermissions(tasks[0]?.project_id || "");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            label="Titre"
            sortKey="title"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Description"
            sortKey="description"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Statut"
            sortKey="status"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Assigné à"
            sortKey="assignee"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Date de début"
            sortKey="start_date"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Date limite"
            sortKey="due_date"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          {(canEditTask || canDeleteTask) && (
            <TableHead className="text-right">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>{task.description || "-"}</TableCell>
            <TableCell>
              <Badge className={cn(statusColors[task.status])}>
                {statusLabels[task.status]}
              </Badge>
            </TableCell>
            <TableCell>{task.assignee || "-"}</TableCell>
            <TableCell>
              {task.start_date
                ? new Date(task.start_date).toLocaleDateString("fr-FR")
                : "-"}
            </TableCell>
            <TableCell>
              <span className={cn(
                isTaskOverdue(task) ? "text-red-600 font-medium" : ""
              )}>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("fr-FR")
                  : "-"}
              </span>
            </TableCell>
            {(canEditTask || canDeleteTask) && (
              <TableCell className="text-right">
                {canEditTask(task.assignee) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(task)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteTask && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.(task)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
