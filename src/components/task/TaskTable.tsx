import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee?: string;
  due_date?: string;
}

interface TaskTableProps {
  tasks: Task[];
  projectId: string;
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

export const TaskTable = ({ tasks }: TaskTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
            label="Assigné à"
            sortKey="assignee"
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
          <SortableHeader
            label="Statut"
            sortKey="status"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>{task.title}</TableCell>
            <TableCell>{task.assignee || "-"}</TableCell>
            <TableCell>
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString("fr-FR")
                : "-"}
            </TableCell>
            <TableCell>
              <Badge className={cn(statusColors[task.status])}>
                {statusLabels[task.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};