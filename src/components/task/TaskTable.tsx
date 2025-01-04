import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SortableHeader } from "../ui/sortable-header";

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

export const TaskTable = ({ tasks: initialTasks }: TaskTableProps) => {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSort(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const tasks = [...initialTasks].sort((a, b) => {
    if (!sort) return 0;

    const getValue = (obj: any, key: string) => {
      return obj[key] || '';
    };

    const aValue = getValue(a, sort.key);
    const bValue = getValue(b, sort.key);

    if (sort.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader sortKey="title" currentSort={sort} onSort={handleSort}>
            Titre
          </SortableHeader>
          <SortableHeader sortKey="assignee" currentSort={sort} onSort={handleSort}>
            Assigné à
          </SortableHeader>
          <SortableHeader sortKey="due_date" currentSort={sort} onSort={handleSort}>
            Date limite
          </SortableHeader>
          <SortableHeader sortKey="status" currentSort={sort} onSort={handleSort}>
            Statut
          </SortableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
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