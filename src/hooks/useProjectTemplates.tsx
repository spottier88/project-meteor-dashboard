
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProjectTemplate {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  created_by?: string;
}

export interface ProjectTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  parent_task_id?: string | null;
  order_index?: number;
  created_at?: string;
  duration_days?: number;
}

export const useProjectTemplates = () => {
  const queryClient = useQueryClient();
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Récupérer tous les modèles
  const { data: templates = [], isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .order("title");
      
      if (error) {
        console.error("Error fetching project templates:", error);
        throw error;
      }
      
      return data as ProjectTemplate[];
    }
  });
  
  // Récupérer un modèle spécifique avec ses tâches
  const getTemplateWithTasks = async (templateId: string) => {
    try {
      const { data: template, error: templateError } = await supabase
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (templateError) throw templateError;
      
      const { data: tasks, error: tasksError } = await supabase
        .from("project_template_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");
      
      if (tasksError) throw tasksError;
      
      return { 
        template: template as ProjectTemplate, 
        tasks: tasks as ProjectTemplateTask[] 
      };
    } catch (error) {
      console.error("Error fetching template with tasks:", error);
      throw error;
    }
  };

  // Récupérer les tâches d'un modèle
  const getTemplateTasks = async (templateId: string) => {
    const { data, error } = await supabase
      .from("project_template_tasks")
      .select("*")
      .eq("template_id", templateId)
      .order("order_index");
    
    if (error) {
      console.error("Error fetching template tasks:", error);
      throw error;
    }
    
    return data as ProjectTemplateTask[];
  };

  // Créer un modèle
  const createTemplate = useMutation({
    mutationFn: async (templateData: Partial<ProjectTemplate>) => {
      setIsLoadingAction(true);
      try {
        // Ensure title is included (required by Supabase type)
        if (!templateData.title) {
          throw new Error("Template title is required");
        }
        
        const { data, error } = await supabase
          .from("project_templates")
          .insert([templateData]) // Insert as an array with single object
          .select();
        
        if (error) throw error;
        return data[0];
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    }
  });
  
  // Mettre à jour un modèle
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<ProjectTemplate> & { id: string }) => {
      setIsLoadingAction(true);
      try {
        const { data, error } = await supabase
          .from("project_templates")
          .update(templateData)
          .eq("id", id)
          .select();
        
        if (error) throw error;
        return data[0];
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    }
  });
  
  // Supprimer un modèle
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      setIsLoadingAction(true);
      try {
        // Supprimer d'abord les tâches associées
        await supabase
          .from("project_template_tasks")
          .delete()
          .eq("template_id", id);
        
        // Puis supprimer le modèle
        const { error } = await supabase
          .from("project_templates")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        return id;
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    }
  });
  
  // Ajouter une tâche à un modèle
  const addTaskToTemplate = useMutation({
    mutationFn: async (taskData: Omit<ProjectTemplateTask, 'id'>) => {
      setIsLoadingAction(true);
      try {
        // Ensure required fields are present
        if (!taskData.template_id || !taskData.title) {
          throw new Error("Template ID and title are required");
        }
        
        const { data, error } = await supabase
          .from("project_template_tasks")
          .insert([taskData]) // Insert as an array with single object
          .select();
        
        if (error) throw error;
        return data[0];
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-template-tasks", data.template_id] });
    }
  });
  
  // Mettre à jour une tâche
  const updateTemplateTask = useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<ProjectTemplateTask> & { id: string }) => {
      setIsLoadingAction(true);
      try {
        const { data, error } = await supabase
          .from("project_template_tasks")
          .update(taskData)
          .eq("id", id)
          .select();
        
        if (error) throw error;
        return data[0];
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-template-tasks", data.template_id] });
    }
  });
  
  // Supprimer une tâche
  const deleteTemplateTask = useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      setIsLoadingAction(true);
      try {
        const { error } = await supabase
          .from("project_template_tasks")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        return { id, templateId };
      } finally {
        setIsLoadingAction(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-template-tasks", data.templateId] });
    }
  });

  return {
    templates,
    isLoadingTemplates,
    isLoadingAction,
    refetchTemplates,
    getTemplateWithTasks,
    getTemplateTasks,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addTaskToTemplate,
    updateTemplateTask,
    deleteTemplateTask
  };
};
