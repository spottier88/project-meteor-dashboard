
/**
 * Adapteurs pour convertir les données de tâches vers le format attendu par le composant Gantt
 */

export interface GanttTask {
  id: string;
  text: string;
  start_date: string; // Format DD-MM-YYYY (string)
  duration: number;   // Durée en jours
  progress: number;   // 0-1
  parent?: string | number; // Optionnel - ID de la tâche parente
  type?: string;      // Optionnel pour les jalons
  color?: string;     // Couleur optionnelle
  readonly?: boolean; // Optionnel pour restreindre l'édition
  open?: boolean;     // Optionnel pour les tâches avec enfants
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
  console.log("Conversion de la tâche:", task);
  
  // Vérifier si au moins une des dates est valide
  const hasValidStartDate = isValidDateString(task.start_date);
  const hasValidDueDate = isValidDateString(task.due_date);
  
  // Si aucune date valide, ne pas inclure la tâche dans le Gantt
  if (!hasValidStartDate && !hasValidDueDate) {
    console.log("Tâche sans dates valides, ignorée:", task.id);
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
    console.log("Tâche sans dates valides (cas improbable):", task.id);
    return null;
  }
  
  // Déterminer la durée
  let duration: number;
  if (hasValidDueDate) {
    // Calculer la durée à partir des dates de début et de fin
    duration = calculateDuration(startDateStr, task.due_date!);
    console.log(`Durée calculée: ${duration} jours entre ${startDateStr} et ${task.due_date}`);
  } else {
    // Si pas de date d'échéance, définir la durée à 1 jour (jalon)
    duration = 1;
    console.log("Jalon sans date d'échéance, durée = 1 jour:", task.id);
  }
  
  // Déterminer si c'est un jalon (même date début/fin ou pas de date de début)
  const isMilestone = (!hasValidStartDate && hasValidDueDate) || 
                      (hasValidStartDate && hasValidDueDate && 
                       task.start_date === task.due_date);
  
  // Calculer la progression en fonction du statut
  const progress = task.status === 'done' ? 1 : task.status === 'in_progress' ? 0.5 : 0;
  
  // Définir l'objet tâche pour Gantt
  const ganttTask: GanttTask = {
    id: task.id,
    text: `${task.title}${assigneeName ? ` - ${assigneeName}` : ''}`,
    start_date: formatDateForGantt(startDateStr),
    duration: duration,
    progress: progress,
    type: isMilestone ? 'milestone' : 'task',
    color: getColorForStatus(task.status),
    readonly: isReadOnly
  };
  
  // Ajouter la propriété parent seulement si elle existe
  // (selon la doc, les tâches sans parent ne devraient pas avoir cette propriété)
  if (task.parent_task_id) {
    ganttTask.parent = task.parent_task_id;
  }
  
  // Pour les tâches parentes, ajouter la propriété open
  if (!task.parent_task_id) {
    ganttTask.open = true;
  }
  
  console.log("Tâche convertie pour Gantt:", ganttTask);
  return ganttTask;
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
