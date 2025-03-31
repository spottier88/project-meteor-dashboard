
/**
 * Adapteurs pour convertir les données de tâches vers le format attendu par le composant Gantt
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
  // S'assurer que nous avons des dates valides
  const hasStartDate = !!task.start_date;
  const startDate = hasStartDate ? new Date(task.start_date) : 
                    (task.due_date ? new Date(task.due_date) : new Date());
  
  // Pour l'end_date, s'assurer qu'elle est après la start_date ou le même jour pour les jalons
  let endDate = task.due_date ? new Date(task.due_date) : new Date(startDate);
  
  // Si la date de fin est avant la date de début, utilisez la date de début
  if (endDate < startDate) {
    endDate = new Date(startDate);
  }
  
  // Déterminer si c'est un jalon (même date début/fin ou pas de date de début)
  const isMilestone = (!hasStartDate && task.due_date) || 
                      (task.start_date && task.due_date && task.start_date === task.due_date);
  
  // Calculer la progression en fonction du statut
  const progress = task.status === 'done' ? 1 : task.status === 'in_progress' ? 0.5 : 0;
  
  return {
    id: task.id,
    text: `${task.title}${assigneeName ? ` - ${assigneeName}` : ''}`,
    start_date: startDate,
    end_date: endDate,
    progress: progress,
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
