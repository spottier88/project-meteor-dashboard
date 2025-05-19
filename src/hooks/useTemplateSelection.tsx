
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectTemplateTask } from "./useProjectTemplates";
import { toast } from "sonner";

export const useTemplateSelection = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  const selectTemplate = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
  };

  // Fonction pour créer les tâches d'un projet à partir d'un modèle
  const applyTemplateToProject = async (projectId: string, templateId: string) => {
    if (!templateId || !projectId) return;
    
    setIsApplyingTemplate(true);
    
    try {
      // 1. Récupérer toutes les tâches du modèle
      const { data: templateTasks, error: tasksError } = await supabase
        .from("project_template_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");
      
      if (tasksError) {
        toast.error("Erreur lors du chargement des tâches du modèle");
        throw tasksError;
      }
      
      if (!templateTasks || templateTasks.length === 0) {
        toast.info("Le modèle sélectionné ne contient aucune tâche");
        return;
      }
      
      // 2. Préparer un dictionnaire pour suivre les correspondances d'IDs
      // entre les tâches du modèle et les nouvelles tâches créées
      const taskIdMapping: Record<string, string> = {};
      
      // 3. Créer d'abord toutes les tâches principales (sans parent)
      const mainTasks = templateTasks.filter((task: ProjectTemplateTask) => task.parent_task_id === null);
      
      for (const task of mainTasks) {
        const newTask = {
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          start_date: task.duration_days ? new Date() : null,
          due_date: task.duration_days ? new Date(Date.now() + task.duration_days * 86400000) : null,
        };
        
        const { data: createdTask, error } = await supabase
          .from("tasks")
          .insert([newTask])
          .select();
        
        if (error) {
          toast.error(`Erreur lors de la création de la tâche "${task.title}"`);
          continue;
        }
        
        if (createdTask && createdTask.length > 0) {
          taskIdMapping[task.id] = createdTask[0].id;
        }
      }
      
      // 4. Ensuite créer les sous-tâches avec les références correctes
      const subTasks = templateTasks.filter((task: ProjectTemplateTask) => task.parent_task_id !== null);
      
      for (const task of subTasks) {
        const parentTaskId = task.parent_task_id ? taskIdMapping[task.parent_task_id] : null;
        
        if (task.parent_task_id && !parentTaskId) {
          toast.error(`Impossible de trouver la tâche parent pour "${task.title}"`);
          continue;
        }
        
        const newTask = {
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          parent_task_id: parentTaskId,
          start_date: task.duration_days ? new Date() : null,
          due_date: task.duration_days ? new Date(Date.now() + task.duration_days * 86400000) : null,
        };
        
        const { data: createdTask, error } = await supabase
          .from("tasks")
          .insert([newTask])
          .select();
        
        if (error) {
          toast.error(`Erreur lors de la création de la sous-tâche "${task.title}"`);
          continue;
        }
        
        if (createdTask && createdTask.length > 0) {
          taskIdMapping[task.id] = createdTask[0].id;
        }
      }
      
      toast.success(`${Object.keys(taskIdMapping).length} tâches créées à partir du modèle`);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'application du modèle:", error);
      toast.error("Erreur lors de l'application du modèle au projet");
      return false;
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  return {
    selectedTemplateId,
    selectTemplate,
    applyTemplateToProject,
    isApplyingTemplate,
    setSelectedTemplateId
  };
};
