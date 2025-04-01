
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
 * Pour les diagrammes Timeline, Google Charts attend un format spécifique:
 * - Première colonne: string (ID de la tâche ou groupe)
 * - Deuxième colonne: string (Nom de la tâche)
 * - Troisième colonne: string (Resource/Assignee)
 * - Quatrième colonne: Date (Date de début)
 * - Cinquième colonne: Date (Date de fin)
 * - Options: style, tooltip, etc.
 */
export const convertTasksToGoogleChartFormat = (
  tasks: TaskData[], 
  profiles: any[] = []
): any[][] => {
  if (!tasks || tasks.length === 0) {
    console.log("Aucune tâche à convertir pour le diagramme Gantt");
    return [
      [
        { type: 'string', id: 'Task ID' },
        { type: 'string', id: 'Task Name' },
        { type: 'string', id: 'Resource' },
        { type: 'date', id: 'Start Date' },
        { type: 'date', id: 'End Date' },
        { type: 'number', id: 'Duration' },
        { type: 'number', id: 'Percent Complete' },
        { type: 'string', id: 'Dependencies' }
      ]
    ];
  }

  console.log("Conversion de tâches pour Google Charts, nombre:", tasks.length);
  
  // Définir l'en-tête du tableau pour Google Charts
  const dataTable: any[][] = [
    [
      { type: 'string', id: 'Task ID' },
      { type: 'string', id: 'Task Name' },
      { type: 'string', id: 'Resource' },
      { type: 'date', id: 'Start Date' },
      { type: 'date', id: 'End Date' },
      { type: 'number', id: 'Duration' },
      { type: 'number', id: 'Percent Complete' },
      { type: 'string', id: 'Dependencies' }
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
    
    // Calculer la durée en millisecondes puis la convertir en jours
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    // Calculer le pourcentage d'avancement
    const percentComplete = task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0;
    
    // Obtenir le nom de l'assigné
    const assigneeName = task.assignee ? getUserName(task.assignee) : 'Non assigné';
    
    // Déterminer les dépendances (tâche parente)
    const dependencies = task.parent_task_id || '';
    
    // Ajouter la tâche au tableau de données - format pour les données (pas les en-têtes)
    dataTable.push([
      task.id,             // Task ID - Valeur directe (string)
      task.title,          // Task Name - Valeur directe (string)
      assigneeName,        // Resource - Valeur directe (string)
      startDate,           // Start Date - Valeur directe (Date object)
      endDate,             // End Date - Valeur directe (Date object)
      durationDays,        // Duration - Valeur directe (number) en jours
      percentComplete,     // Percent Complete - Valeur directe (number)
      dependencies         // Dependencies - Valeur directe (string)
    ]);
    
    console.log(`Tâche ajoutée au Gantt: ${task.id} (${task.title}), début: ${startDate.toISOString()}, fin: ${endDate.toISOString()}, durée: ${durationDays} jours`);
  }
  
  console.log("Nombre de lignes de données pour Google Charts:", dataTable.length - 1);
  return dataTable;
};
