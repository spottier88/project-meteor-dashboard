
import { Task } from 'gantt-task-react';

// Fonction pour obtenir une couleur en fonction du statut de la tâche
const getColorForStatus = (status: string) => {
  switch (status) {
    case 'todo':
      return '#e2e8f0'; // Gris clair
    case 'in_progress':
      return '#3b82f6'; // Bleu
    case 'done':
      return '#22c55e'; // Vert
    default:
      return '#94a3b8'; // Gris par défaut
  }
};

// Fonction pour convertir les tâches au format attendu par le composant Gantt
export const mapTasksToGanttFormat = (tasks: any[]): Task[] => {
  if (!tasks || tasks.length === 0) return [];
  
  return tasks.map(task => {
    // Définir les dates de début et de fin
    let start = task.start_date ? new Date(task.start_date) : new Date();
    let end = task.due_date ? new Date(task.due_date) : new Date();
    
    // Si pas de date de fin, définir à start + 1 jour
    if (!task.due_date) {
      end.setDate(start.getDate() + 1);
    }
    
    // S'assurer que la date de fin est après la date de début
    if (end <= start) {
      end.setDate(start.getDate() + 1);
    }
    
    // Calculer le pourcentage de progression
    let progress = 0;
    if (task.status === 'in_progress') progress = 50;
    if (task.status === 'done') progress = 100;
    
    // Déterminer si c'est un jalon (milestone) ou une tâche normale
    // Une tâche est un jalon si les dates de début et de fin sont identiques ou non définies
    const isMilestone = !task.start_date || !task.due_date || 
      (new Date(task.start_date).setHours(0, 0, 0, 0) === new Date(task.due_date).setHours(0, 0, 0, 0));
    
    // Déterminer le type (tâche ou sous-tâche)
    // Si c'est un jalon, on définit le type comme 'milestone', sinon 'task'
    const type = isMilestone ? 'milestone' : 'task';
    
    // Créer l'objet de tâche au format attendu par le composant Gantt
    return {
      id: task.id,
      name: task.title,
      start,
      end,
      progress,
      type,
      styles: { 
        backgroundColor: getColorForStatus(task.status),
        progressColor: '#4d7c0f',
        progressSelectedColor: '#84cc16',
      },
      isDisabled: false,
      hideChildren: false,
      project: task.parent_task_id || undefined, // Utiliser parent_task_id pour relier les tâches filles aux tâches mères
      dependencies: task.dependencies || [],
    };
  });
};

// Fonction pour formater les dates en français
export const formatDateFr = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
