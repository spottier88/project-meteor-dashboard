
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Pencil, Trash2, FileText, ClipboardCheck, GripVertical } from "lucide-react";
import { useTaskPermissions } from "@/hooks/useTaskPermissions";
import { formatUserName } from "@/utils/formatUserName";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  document_url?: string;
  completion_comment?: string;
  order_index?: number;
}

interface TaskTableProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isProjectClosed?: boolean;
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

/** Ligne de tableau réordonnançable via drag & drop */
const SortableRow = ({ task, children }: { task: Task; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      {children}
    </TableRow>
  );
};

/** Poignée de drag & drop */
const DragHandle = ({ taskId }: { taskId: string }) => {
  const { listeners, setActivatorNodeRef } = useSortable({ id: taskId });
  return (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      title="Glisser pour réordonner"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
};

export const TaskTable = ({ tasks, onEdit, onDelete, isProjectClosed = false }: TaskTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const { canEditTask: hookCanEdit, canDeleteTask: hookCanDelete } = useTaskPermissions(tasks[0]?.project_id || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Forcer lecture seule si projet clôturé
  const canEditTask = (assignee?: string) => isProjectClosed ? false : hookCanEdit(assignee);
  const canDeleteTask = isProjectClosed ? false : hookCanDelete;

  // Le drag & drop est actif si aucun tri par colonne n'est sélectionné et que l'utilisateur peut éditer
  const isDragEnabled = !sortKey && !sortDirection && !isProjectClosed;

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fonction de changement rapide de statut
  const cycleTaskStatus = async (taskId: string, currentStatus: string, assignee?: string) => {
    if (!canEditTask(assignee)) return;
    const nextStatus: Record<string, "todo" | "in_progress" | "done"> = { todo: "in_progress", in_progress: "done", done: "todo" };
    const next = nextStatus[currentStatus];
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", taskId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de changer le statut", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tasks", tasks[0]?.project_id] });
      toast({ title: "Statut mis à jour", description: `Statut changé vers "${statusLabels[next as keyof typeof statusLabels]}"` });
    }
  };

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
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Séparer les tâches en tâches parentes et sous-tâches
  const parentTasks = tasks.filter(task => !task.parent_task_id);
  const childTasks = tasks.filter(task => task.parent_task_id);
  
  // Index des sous-tâches par parent
  const childTasksByParent: Record<string, Task[]> = {};
  childTasks.forEach(task => {
    if (task.parent_task_id) {
      if (!childTasksByParent[task.parent_task_id]) {
        childTasksByParent[task.parent_task_id] = [];
      }
      childTasksByParent[task.parent_task_id].push(task);
    }
  });

  const profiles = projectMembers?.map(member => member.profiles) || [];

  // Trier les tâches parentes : par order_index si aucun tri actif, sinon par colonne
  const computeSortedTasks = useCallback((source: Task[]) => {
    return [...source].sort((a: any, b: any) => {
      if (!sortKey || !sortDirection) {
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      }
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (sortDirection === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }, [sortKey, sortDirection]);

  // État local pour mise à jour optimiste après drag & drop
  const [localParentTasks, setLocalParentTasks] = useState<Task[]>(() => computeSortedTasks(parentTasks));

  // Resynchroniser quand les props changent (nouveau fetch, tri, etc.)
  useEffect(() => {
    setLocalParentTasks(computeSortedTasks(parentTasks));
  }, [parentTasks, computeSortedTasks]);

  const sortedParentTasks = localParentTasks;

  // Gestion du drag & drop — mise à jour optimiste puis persistence
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedParentTasks.findIndex(t => t.id === active.id);
    const newIndex = sortedParentTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Mise à jour optimiste immédiate de l'affichage
    const reordered = arrayMove(sortedParentTasks, oldIndex, newIndex);
    const reorderedWithIndex = reordered.map((task, index) => ({
      ...task,
      order_index: index + 1,
    }));
    setLocalParentTasks(reorderedWithIndex);

    // Persistence en base
    const promises = reorderedWithIndex.map(t =>
      supabase.from("tasks").update({ order_index: t.order_index }).eq("id", t.id)
    );
    
    const results = await Promise.all(promises);
    const hasError = results.some(r => r.error);
    if (hasError) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'ordre", variant: "destructive" });
    } else {
      toast({ title: "Ordre mis à jour" });
    }

    // Rafraîchir toutes les queries liées aux tâches pour resynchroniser le parent
    await queryClient.refetchQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return key === "tasks" || key === "aggregatedTasks";
      },
    });
  }, [sortedParentTasks, queryClient, toast]);

  // Rendu d'une ligne de tâche (parent ou enfant)
  const renderTaskCells = (task: Task, isChild: boolean = false) => (
    <>
      <TableCell className={cn("font-medium", isChild && "pl-10")}>
        {!isChild && task.id in childTasksByParent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-1 p-0"
            onClick={() => toggleTaskExpanded(task.id)}
          >
            {expandedTasks[task.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        {task.title}
        {task.document_url && (
          <a href={task.document_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex ml-1 text-primary hover:text-primary/80" title="Document lié"
            onClick={(e) => e.stopPropagation()}>
            <FileText className="h-4 w-4" />
          </a>
        )}
        {task.completion_comment && (
          <span title={task.completion_comment} className="inline-flex ml-1 text-green-600">
            <ClipboardCheck className="h-4 w-4" />
          </span>
        )}
        {!isChild && task.id in childTasksByParent && (
          <Badge variant="outline" className="ml-2 text-xs">
            {childTasksByParent[task.id].length} sous-tâche(s)
          </Badge>
        )}
      </TableCell>
      <TableCell>{task.description || "-"}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className={cn(
                  statusColors[task.status],
                  canEditTask(task.assignee) && "cursor-pointer hover:opacity-80 transition-opacity"
                )}
                onClick={() => canEditTask(task.assignee) && cycleTaskStatus(task.id, task.status, task.assignee)}
              >
                {statusLabels[task.status]}
              </Badge>
            </TooltipTrigger>
            {canEditTask(task.assignee) && (
              <TooltipContent>Cliquer pour avancer le statut</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>{formatUserName(task.assignee, profiles)}</TableCell>
      <TableCell>
        {task.start_date ? new Date(task.start_date).toLocaleDateString("fr-FR") : "-"}
      </TableCell>
      <TableCell>
        <span className={cn(isTaskOverdue(task) ? "text-red-600 font-medium" : "")}>
          {task.due_date ? new Date(task.due_date).toLocaleDateString("fr-FR") : "-"}
        </span>
      </TableCell>
      {(canEditTask || canDeleteTask) && (
        <TableCell className="text-right">
          {canEditTask(task.assignee) && (
            <Button variant="ghost" size="icon" onClick={() => onEdit?.(task)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDeleteTask && (
            <Button variant="ghost" size="icon" onClick={() => onDelete?.(task)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      )}
    </>
  );

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          {isDragEnabled && <TableHead className="w-8"></TableHead>}
          <SortableHeader label="Titre" sortKey="title" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          <SortableHeader label="Description" sortKey="description" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          <SortableHeader label="Statut" sortKey="status" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          <SortableHeader label="Assigné à" sortKey="assignee" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          <SortableHeader label="Date de début" sortKey="start_date" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          <SortableHeader label="Date limite" sortKey="due_date" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
          {(canEditTask || canDeleteTask) && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedParentTasks.map((task) => (
          <React.Fragment key={task.id}>
            {isDragEnabled ? (
              <SortableRow task={task}>
                <TableCell className="w-8"><DragHandle taskId={task.id} /></TableCell>
                {renderTaskCells(task)}
              </SortableRow>
            ) : (
              <TableRow className={task.id in childTasksByParent ? "border-b-0" : ""}>
                {renderTaskCells(task)}
              </TableRow>
            )}
            
            {/* Sous-tâches */}
            {task.id in childTasksByParent && expandedTasks[task.id] && (
              childTasksByParent[task.id].map(childTask => (
                <TableRow key={childTask.id} className="bg-muted/30">
                  {isDragEnabled && <TableCell className="w-8" />}
                  {renderTaskCells(childTask, true)}
                </TableRow>
              ))
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );

  // Envelopper dans DndContext uniquement si le drag est actif
  if (isDragEnabled) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedParentTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tableContent}
        </SortableContext>
      </DndContext>
    );
  }

  return tableContent;
};
