import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Assigné à</TableHead>
          <TableHead>Date limite</TableHead>
          <TableHead>Statut</TableHead>
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