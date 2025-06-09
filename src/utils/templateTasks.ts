
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

/**
 * Crée des tâches dans un projet à partir d'un modèle de projet
 * @param templateId L'ID du modèle à utiliser
 * @param projectId L'ID du projet pour lequel créer les tâches
 * @param projectStartDate Date de début du projet (optionnelle)
 * @returns Un booléen indiquant si l'opération a réussi
 */
export const createTasksFromTemplate = async (
  templateId: string, 
  projectId: string, 
  projectStartDate?: string
): Promise<boolean> => {
  try {
    // 1. Récupérer toutes les tâches du modèle
    const { data: templateTasks, error } = await supabase
      .from('project_template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('parent_task_id', { ascending: true, nullsFirst: true })
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error("Erreur lors de la récupération des tâches du modèle:", error);
      return false;
    }
    
    if (!templateTasks || templateTasks.length === 0) {
      logger.debug("Aucune tâche trouvée dans le modèle");
      return true; // Pas d'erreur, juste aucune tâche à créer
    }

    logger.debug(`Création de ${templateTasks.length} tâches pour le projet ${projectId}`);
    logger.debug("Date de début du projet fournie:", projectStartDate);
    
    // Déterminer la date de départ pour les tâches
    // Si projectStartDate est fourni, l'utiliser, sinon utiliser la date du jour
    const startDateObj = projectStartDate 
      ? new Date(projectStartDate) 
      : new Date();
    
    logger.debug("Date de départ utilisée:", startDateObj.toISOString());
    
    // 2. Mapper les anciens IDs de tâches vers les nouveaux pour gérer les tâches parentes
    const taskIdMap = new Map<string, string>();
    
    // 3. Créer d'abord les tâches principales (sans parent)
    for (const task of templateTasks.filter(t => !t.parent_task_id)) {
      // Calculer la date de début et d'échéance
      let taskStartDate = new Date(startDateObj);
      let taskDueDate = null;
      
      // Si la tâche a une durée, calculer la date d'échéance
      if (task.duration_days) {
        taskDueDate = new Date(taskStartDate);
        taskDueDate.setDate(taskStartDate.getDate() + task.duration_days);
      }
      
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: task.title,
          description: task.description || '',
          status: 'todo', // Toujours commencer par "à faire"
          start_date: taskStartDate.toISOString().split('T')[0], // Format YYYY-MM-DD
          due_date: taskDueDate ? taskDueDate.toISOString().split('T')[0] : null,
        })
        .select()
        .single();
      
      if (taskError) {
        console.error("Erreur lors de la création d'une tâche principale:", taskError);
        continue;
      }
      
      // Stocker la correspondance des IDs
      taskIdMap.set(task.id, newTask.id);
      logger.debug(`Tâche principale créée: ${task.title} (${newTask.id})`);
    }
    
    // 4. Créer ensuite les sous-tâches
    for (const task of templateTasks.filter(t => t.parent_task_id)) {
      const parentTaskId = taskIdMap.get(task.parent_task_id);
      
      if (!parentTaskId) {
        console.error("Tâche parente non trouvée pour la sous-tâche:", task.id);
        continue;
      }
      
      // Calculer la date de début et d'échéance
      let taskStartDate = new Date(startDateObj);
      let taskDueDate = null;
      
      // Si la tâche a une durée, calculer la date d'échéance
      if (task.duration_days) {
        taskDueDate = new Date(taskStartDate);
        taskDueDate.setDate(taskStartDate.getDate() + task.duration_days);
      }
      
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: task.title,
          description: task.description || '',
          status: 'todo', // Toujours commencer par "à faire"
          start_date: taskStartDate.toISOString().split('T')[0], // Format YYYY-MM-DD
          due_date: taskDueDate ? taskDueDate.toISOString().split('T')[0] : null,
          parent_task_id: parentTaskId,
        })
        .select()
        .single();
      
      if (taskError) {
        console.error("Erreur lors de la création d'une sous-tâche:", taskError);
        continue;
      }
      
      logger.debug(`Sous-tâche créée: ${task.title} (${newTask.id}) - parent: ${parentTaskId}`);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la création des tâches à partir du modèle:", error);
    return false;
  }
};
