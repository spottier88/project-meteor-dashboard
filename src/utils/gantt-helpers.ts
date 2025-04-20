
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

// Définir le type TaskType manuellement puisqu'il n'est pas exporté par la bibliothèque
type TaskType = 'task' | 'milestone' | 'project';

// Fonction pour convertir les tâches au format attendu par le composant Gantt
export const mapTasksToGanttFormat = (tasks: any[]): Task[] => {
  if (!tasks || tasks.length === 0) return [];
  
  // On crée d'abord un dictionnaire des tâches par ID pour faciliter la recherche
  const tasksById = tasks.reduce((acc, task) => {
    acc[task.id] = task;
    return acc;
  }, {} as Record<string, any>);
  
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
    
    // Déterminer le type (projet, tâche ou sous-tâche)
    let type: TaskType = 'task';
    
    // Si c'est un projet (pas de parent_task_id et a un project_id qui est égal à son id)
    if (!task.parent_task_id && task.project_id === task.id) {
      type = 'project';
    } 
    // Si c'est un jalon
    else if (isMilestone) {
      type = 'milestone';
    }
    
    // Construire les dépendances entre les tâches
    // Si la tâche a un parent_task_id, l'ajouter comme dépendance
    let dependencies: string[] = [];
    if (task.parent_task_id && tasksById[task.parent_task_id]) {
      dependencies.push(task.parent_task_id);
    }
    
    // Ajouter également les dépendances explicites si elles existent
    if (task.dependencies && Array.isArray(task.dependencies)) {
      dependencies = [...dependencies, ...task.dependencies];
    }
    
    // Créer l'objet de tâche au format attendu par le composant Gantt
    return {
      id: task.id,
      name: task.title,
      start,
      end,
      progress,
      type,
      styles: { 
        backgroundColor: type === 'project' ? '#9b87f5' : getColorForStatus(task.status),
        progressColor: '#4d7c0f',
        progressSelectedColor: '#84cc16',
      },
      isDisabled: false,
      hideChildren: false,
      project: task.parent_task_id || undefined, // Utiliser parent_task_id pour relier les tâches filles aux tâches mères
      dependencies: dependencies.length > 0 ? dependencies : undefined, // Utiliser les dépendances calculées
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
