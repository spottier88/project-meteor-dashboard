
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useTaskPermissions } from "@/hooks/use-task-permissions";
import { formatUserName } from "@/utils/formatUserName";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

interface TaskTableProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isProjectClosed?: boolean; // Prop pour forcer le mode lecture seule si projet clôturé
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

export const TaskTable = ({ tasks, onEdit, onDelete, isProjectClosed = false }: TaskTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const { canEditTask: hookCanEdit, canDeleteTask: hookCanDelete } = useTaskPermissions(tasks[0]?.project_id || "");

  // Forcer lecture seule si projet clôturé (override synchrone des permissions async)
  const canEditTask = (assignee?: string) => isProjectClosed ? false : hookCanEdit(assignee);
  const canDeleteTask = isProjectClosed ? false : hookCanDelete;

  // Récupérer les profils des membres du projet
  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", tasks[0]?.project_id],
    queryFn: async () => {
      if (!tasks[0]?.project_id) return [];
      
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
        .eq("project_id", tasks[0].project_id);

      if (error) throw error;
      
      // Récupérer aussi le chef de projet
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", tasks[0].project_id)
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
    enabled: !!tasks[0]?.project_id,
  });

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

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Séparer les tâches en tâches parentes et sous-tâches
  const parentTasks = tasks.filter(task => !task.parent_task_id);
  const childTasks = tasks.filter(task => task.parent_task_id);
  
  // Créer un index des sous-tâches par tâche parente
  const childTasksByParent: Record<string, Task[]> = {};
  childTasks.forEach(task => {
    if (task.parent_task_id) {
      if (!childTasksByParent[task.parent_task_id]) {
        childTasksByParent[task.parent_task_id] = [];
      }
      childTasksByParent[task.parent_task_id].push(task);
    }
  });

  // Extraire les profils pour les passer à formatUserName
  const profiles = projectMembers?.map(member => member.profiles) || [];

  // Trier les tâches parentes
  const sortedParentTasks = [...parentTasks].sort((a: any, b: any) => {
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
        {sortedParentTasks.map((task) => (
          <>
            <TableRow key={task.id} className={task.id in childTasksByParent ? "border-b-0" : ""}>
              <TableCell className="font-medium">
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
                {task.title}
                {task.id in childTasksByParent && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {childTasksByParent[task.id].length} sous-tâche(s)
                  </Badge>
                )}
              </TableCell>
              <TableCell>{task.description || "-"}</TableCell>
              <TableCell>
                <Badge className={cn(statusColors[task.status])}>
                  {statusLabels[task.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatUserName(task.assignee, profiles)}</TableCell>
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
            
            {/* Afficher les sous-tâches si la tâche parente est étendue */}
            {task.id in childTasksByParent && expandedTasks[task.id] && (
              childTasksByParent[task.id].map(childTask => (
                <TableRow key={childTask.id} className="bg-muted/30">
                  <TableCell className="font-medium pl-10">
                    {childTask.title}
                  </TableCell>
                  <TableCell>{childTask.description || "-"}</TableCell>
                  <TableCell>
                    <Badge className={cn(statusColors[childTask.status])}>
                      {statusLabels[childTask.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatUserName(childTask.assignee, profiles)}</TableCell>
                  <TableCell>
                    {childTask.start_date
                      ? new Date(childTask.start_date).toLocaleDateString("fr-FR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      isTaskOverdue(childTask) ? "text-red-600 font-medium" : ""
                    )}>
                      {childTask.due_date
                        ? new Date(childTask.due_date).toLocaleDateString("fr-FR")
                        : "-"}
                    </span>
                  </TableCell>
                  {(canEditTask || canDeleteTask) && (
                    <TableCell className="text-right">
                      {canEditTask(childTask.assignee) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit?.(childTask)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteTask && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete?.(childTask)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
};
