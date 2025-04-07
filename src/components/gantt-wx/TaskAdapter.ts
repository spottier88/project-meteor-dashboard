
import { GanttTask, GanttDependency, GanttColumn } from "./types";

/**
 * Convertit les tâches du format de l'application au format requis par wx-react-gantt
 */
export const convertTasksToGanttFormat = (tasks: any[]): GanttTask[] => {
  if (!tasks || !tasks.length) return [];
  
  return tasks.map(task => {
    if (!task) return null;
    
    // Utiliser les dates de début et de fin si disponibles, sinon utiliser des valeurs par défaut
    let startDate = task.start_date ? new Date(task.start_date) : new Date();
    let endDate = task.due_date ? new Date(task.due_date) : new Date(startDate);
    
    // Si la date de fin est antérieure à la date de début, ajouter un jour
    if (endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Déterminer la couleur en fonction du statut
    let backgroundColor = "#9b87f5"; // Couleur par défaut (violette)
    switch (task.status) {
      case "todo":
        backgroundColor = "#D6BCFA"; // Violet clair
        break;
      case "in_progress":
        backgroundColor = "#9b87f5"; // Violet normal
        break;
      case "done":
        backgroundColor = "#6E59A5"; // Violet foncé
        break;
    }
    
    // Calculer la progression en fonction du statut
    let progress = 0;
    switch (task.status) {
      case "todo":
        progress = 0;
        break;
      case "in_progress":
        progress = 50;
        break;
      case "done":
        progress = 100;
        break;
    }

    // Créer l'objet tâche avec toutes les propriétés requises par wx-react-gantt
    return {
      id: task.id,
      parentId: task.parent_task_id || null,
      name: task.title || "Tâche sans titre",
      start: startDate,
      end: endDate,
      progress: progress,
      type: 'task', // Type obligatoire pour wx-react-gantt
      isExpanded: true, // Assurer que les tâches sont toujours développées
      hideChildren: false,
      backgroundColor: backgroundColor,
      // Propriétés supplémentaires pour référence
      project_id: task.project_id,
      status: task.status,
      assignee: task.assignee,

    };
  }).filter(Boolean) as GanttTask[]; // Filtrer les valeurs null et cast vers GanttTask[]
};

/**
 * Crée des dépendances entre les tâches parentes et enfants
 */
export const createDependenciesFromTasks = (tasks: any[]): GanttDependency[] => {
  if (!tasks || !tasks.length) return [];
  
  const dependencies: GanttDependency[] = [];
  
  // Créer des dépendances entre les tâches parentes et enfants
  tasks.forEach(task => {
    if (task && task.parent_task_id) {
      dependencies.push({
        id: `${task.parent_task_id}_to_${task.id}`,
        fromId: task.parent_task_id,
        toId: task.id,
        type: 0 // Finish-to-Start
      });
    }
  });
  
  return dependencies;
};

/**
 * Crée les colonnes pour le tableau des tâches
 */
export const createDefaultColumns = (): GanttColumn[] => {
  return [
    {
      name: 'Tâche',
      key: 'name',
      width: 250,
      resizable: true,
      cell: ({ task }) => task?.name ?? '—',
    },
    {
      name: 'Début',
      key: 'start',
      width: 120,
      align: 'center',
      cell: ({ task }) => {
        if (!task?.start) return '-';
        return new Date(task.start).toLocaleDateString('fr-FR');
      }
    },
    {
      name: 'Fin',
      key: 'end',
      width: 120,
      align: 'center',
      cell: ({ task }) => {
        if (!task?.end) return '-';
        return new Date(task.end).toLocaleDateString('fr-FR');
      }
    },
    {
      name: 'Statut',
      key: 'status',
      width: 100,
      align: 'center',
      cell: ({ task }) => {
        switch (task?.status) {
          case 'todo': return 'À faire';
          case 'in_progress': return 'En cours';
          case 'done': return 'Terminé';
          default: return '-';
        }
      }
    },
    {
      name: 'Assignée à',
      key: 'assignee',
      width: 150,
      cell: ({ task }) => task?.assignee || '-',
    }
  ];
};

