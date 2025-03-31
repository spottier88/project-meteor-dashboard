
/**
 * Adaptateurs pour convertir les données de tâches vers le format attendu par le composant Gantt
 */

export interface GanttTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  progress: number;
  parent: string | number;
  type: string;
  color: string;
  readonly?: boolean;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee?: string;
  due_date?: string;
  start_date?: string;
  project_id: string;
  parent_task_id?: string | null;
}

/**
 * Convertit une tâche du format de l'application vers le format attendu par le Gantt
 */
export const convertTaskToGantt = (
  task: TaskData, 
  assigneeName: string = '',
  isReadOnly: boolean = false
): GanttTask => {
  const hasStartDate = !!task.start_date;
  const startDate = task.start_date ? new Date(task.start_date) : 
                    (task.due_date ? new Date(task.due_date) : new Date());
  const endDate = task.due_date ? new Date(task.due_date) : new Date(startDate);
  
  const isMilestone = !hasStartDate || (task.start_date === task.due_date);
  
  return {
    id: task.id,
    text: `${task.title}${assigneeName ? ` - ${assigneeName}` : ''}`,
    start_date: startDate,
    end_date: endDate,
    progress: task.status === 'done' ? 1 : task.status === 'in_progress' ? 0.5 : 0,
    parent: task.parent_task_id || 0,
    type: isMilestone ? 'milestone' : 'task',
    color: getColorForStatus(task.status),
    readonly: isReadOnly
  };
};

/**
 * Obtient la couleur en fonction du statut de la tâche
 */
export const getColorForStatus = (status: string): string => {
  switch (status) {
    case 'todo':
      return '#F2FCE2';
    case 'in_progress':
      return '#D3E4FD';
    case 'done':
      return '#E2E8F0';
    default:
      return '#F3F4F6';
  }
};
