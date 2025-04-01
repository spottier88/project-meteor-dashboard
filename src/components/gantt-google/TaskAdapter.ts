
/**
 * Adapteurs pour convertir les données de tâches vers le format attendu par Google Charts
 */

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
 * Obtient la couleur en fonction du statut de la tâche
 */
export const getColorForStatus = (status: string): string => {
  switch (status) {
    case 'todo':
      return '#F2FCE2'; // Vert pâle
    case 'in_progress':
      return '#D3E4FD'; // Bleu pâle
    case 'done':
      return '#E2E8F0'; // Gris pâle
    default:
      return '#F3F4F6'; // Gris très pâle
  }
};

/**
 * Convertit un tableau de tâches au format Google Charts Timeline
 */
export const convertTasksToGoogleChartFormat = (
  tasks: TaskData[], 
  profiles: any[] = []
): any[] => {
  if (!tasks || tasks.length === 0) {
    console.log("Aucune tâche à convertir pour le diagramme Gantt");
    return [
      [
        { type: 'string', id: 'Task ID' },
        { type: 'string', id: 'Task Name' },
        { type: 'string', id: 'Resource' },
        { type: 'date', id: 'Start Date' },
        { type: 'date', id: 'End Date' },
        { type: 'string', id: 'Status' },
        { type: 'string', id: 'Dependencies' },
        { type: 'number', id: 'Percent Complete' }
      ]
    ];
  }

  console.log("Conversion de tâches pour Google Charts, nombre:", tasks.length);
  
  // Définir l'en-tête du tableau pour Google Charts
  const dataTable = [
    [
      { type: 'string', id: 'Task ID' },
      { type: 'string', id: 'Task Name' },
      { type: 'string', id: 'Resource' },
      { type: 'date', id: 'Start Date' },
      { type: 'date', id: 'End Date' },
      { type: 'string', id: 'Status' },
      { type: 'string', id: 'Dependencies' },
      { type: 'number', id: 'Percent Complete' }
    ]
  ];

  // Récupérer les noms d'utilisateurs formatés
  const getUserName = (email?: string): string => {
    if (!email) return '';
    
    const profile = profiles.find(p => p.email === email);
    if (!profile) return email;
    
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email;
  };

  // Traiter les tâches pour les ajouter au tableau
  for (const task of tasks) {
    // Vérifier si les dates sont valides
    const hasValidStartDate = isValidDateString(task.start_date);
    const hasValidDueDate = isValidDateString(task.due_date);
    
    // Si aucune date valide, ignorer cette tâche
    if (!hasValidStartDate && !hasValidDueDate) {
      console.log(`Tâche ${task.id} (${task.title}) ignorée: aucune date valide`);
      continue;
    }
    
    // Déterminer les dates de début et de fin
    let startDate: Date;
    let endDate: Date;
    
    if (hasValidStartDate) {
      startDate = new Date(task.start_date!);
    } else {
      // Si pas de date de début, utiliser la date d'échéance comme début
      startDate = new Date(task.due_date!);
    }
    
    if (hasValidDueDate) {
      endDate = new Date(task.due_date!);
    } else {
      // Si pas de date d'échéance, définir la fin à un jour après le début
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Si les dates sont identiques, ajouter une journée à la date de fin pour la visibilité
    if (startDate.getTime() === endDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Calculer le pourcentage d'avancement
    const percentComplete = task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0;
    
    // Obtenir le nom de l'assigné
    const assigneeName = task.assignee ? getUserName(task.assignee) : 'Non assigné';
    
    // Déterminer les dépendances (tâche parente)
    const dependencies = task.parent_task_id || null;
    
    // Ajouter la tâche au tableau de données - correction du format pour respecter les types attendus par Google Charts
    dataTable.push([
      task.id,                            // ID de la tâche (string)
      task.title,                         // Nom de la tâche (string)
      assigneeName,                       // Ressource (assigné) (string)
      startDate,                          // Date de début (Date object)
      endDate,                            // Date de fin (Date object)
      task.status,                        // Statut (string)
      dependencies,                       // Dépendances (string or null)
      percentComplete                     // Pourcentage d'avancement (number)
    ]);
    
    console.log(`Tâche ajoutée au Gantt: ${task.id} (${task.title}), début: ${startDate.toISOString()}, fin: ${endDate.toISOString()}`);
  }
  
  console.log("Nombre de lignes de données pour Google Charts:", dataTable.length - 1);
  return dataTable;
};
