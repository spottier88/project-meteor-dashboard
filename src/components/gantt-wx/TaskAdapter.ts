
/**
 * Adapteurs pour convertir les données de tâches vers le format attendu par le composant Gantt
 */

export interface GanttTask {
  id: string;
  text: string;
  start_date: string; // Modifié: string au format DD-MM-YYYY au lieu d'un objet Date
  duration: number;   // Ajouté: durée en jours au lieu de end_date
  progress: number;
  parent: string | number;
  type?: string;      // Optionnel pour les jalons
  color?: string;     // Couleur optionnelle
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
 * Vérifie si une chaîne de date est valide pour la conversion en objet Date
 */
const isValidDateString = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  
  // Vérifier si la date peut être convertie en objet Date valide
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Convertit une date au format YYYY-MM-DD (ISO) en format DD-MM-YYYY (Gantt)
 */
const formatDateForGantt = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Calcule la durée en jours entre deux dates
 */
const calculateDuration = (startDateStr: string, endDateStr: string): number => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 0 ? 1 : diffDays; // Durée minimum d'un jour
};

/**
 * Convertit une tâche du format de l'application vers le format attendu par le Gantt
 */
export const convertTaskToGantt = (
  task: TaskData, 
  assigneeName: string = '',
  isReadOnly: boolean = false
): GanttTask | null => {
  // Vérifier si au moins une des dates est valide
  const hasValidStartDate = isValidDateString(task.start_date);
  const hasValidDueDate = isValidDateString(task.due_date);
  
  // Si aucune date valide, ne pas inclure la tâche dans le Gantt
  if (!hasValidStartDate && !hasValidDueDate) {
    return null;
  }
  
  // Déterminer la date de début
  let startDateStr: string;
  if (hasValidStartDate) {
    startDateStr = task.start_date!;
  } else if (hasValidDueDate) {
    // Si pas de date de début mais une date d'échéance, utiliser la date d'échéance (jalon)
    startDateStr = task.due_date!;
  } else {
    // Ne devrait jamais arriver grâce à la vérification précédente
    return null;
  }
  
  // Déterminer la date de fin ou la durée
  let duration: number;
  if (hasValidDueDate) {
    // Calculer la durée à partir des dates de début et de fin
    duration = calculateDuration(startDateStr, task.due_date!);
  } else {
    // Si pas de date d'échéance, définir la durée à 1 jour (jalon)
    duration = 1;
  }
  
  // Déterminer si c'est un jalon (même date début/fin ou pas de date de début)
  const isMilestone = (!hasValidStartDate && hasValidDueDate) || 
                      (hasValidStartDate && hasValidDueDate && 
                       task.start_date === task.due_date);
  
  // Calculer la progression en fonction du statut
  const progress = task.status === 'done' ? 1 : task.status === 'in_progress' ? 0.5 : 0;
  
  return {
    id: task.id,
    text: `${task.title}${assigneeName ? ` - ${assigneeName}` : ''}`,
    start_date: formatDateForGantt(startDateStr),
    duration: duration,
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
