
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_active: boolean;
}

export interface ProjectTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  duration_days: number | null;
  order_index: number;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjectTemplates = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Récupérer tous les modèles
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .order("title");

      if (error) {
        toast.error("Erreur lors du chargement des modèles de projet");
        throw error;
      }

      return data as ProjectTemplate[];
    },
  });

  // Récupérer un modèle avec ses tâches
  const getTemplateWithTasks = async (templateId: string) => {
    setIsLoading(true);
    try {
      // Récupérer le modèle
      const { data: template, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) {
        toast.error("Erreur lors du chargement du modèle");
        throw error;
      }

      // Récupérer les tâches du modèle
      const { data: tasks, error: tasksError } = await supabase
        .from("project_template_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");

      if (tasksError) {
        toast.error("Erreur lors du chargement des tâches du modèle");
        throw tasksError;
      }

      return {
        template: template as ProjectTemplate,
        tasks: tasks as ProjectTemplateTask[],
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un nouveau modèle
  const createTemplate = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("project_templates")
        .insert({ title, description: description || null })
        .select()
        .single();

      if (error) {
        toast.error("Erreur lors de la création du modèle");
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Modèle créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    },
  });

  // Mettre à jour un modèle
  const updateTemplate = useMutation({
    mutationFn: async ({ id, title, description, is_active }: { id: string; title: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from("project_templates")
        .update({ 
          title, 
          description: description || null, 
          is_active: is_active === undefined ? true : is_active 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        toast.error("Erreur lors de la mise à jour du modèle");
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Modèle mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    },
  });

  // Supprimer un modèle
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // Les tâches seront supprimées automatiquement grâce à ON DELETE CASCADE
      const { error } = await supabase
        .from("project_templates")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Erreur lors de la suppression du modèle");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Modèle supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    },
  });

  // Créer une tâche pour un modèle
  const createTemplateTask = useMutation({
    mutationFn: async ({ 
      template_id, 
      title, 
      description, 
      status = "todo", 
      duration_days,
      order_index = 0,
      parent_task_id = null 
    }: Partial<ProjectTemplateTask> & { template_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("project_template_tasks")
        .insert({ 
          template_id, 
          title, 
          description, 
          status, 
          duration_days, 
          order_index,
          parent_task_id 
        })
        .select()
        .single();

      if (error) {
        toast.error("Erreur lors de la création de la tâche");
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success("Tâche ajoutée au modèle");
      queryClient.invalidateQueries({ queryKey: ["project-template-tasks", variables.template_id] });
    },
  });

  // Mettre à jour une tâche
  const updateTemplateTask = useMutation({
    mutationFn: async ({ 
      id,
      title, 
      description, 
      status, 
      duration_days,
      order_index,
      parent_task_id 
    }: Partial<ProjectTemplateTask> & { id: string }) => {
      const updateData: Partial<ProjectTemplateTask> = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (duration_days !== undefined) updateData.duration_days = duration_days;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (parent_task_id !== undefined) updateData.parent_task_id = parent_task_id;
      
      const { data, error } = await supabase
        .from("project_template_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        toast.error("Erreur lors de la mise à jour de la tâche");
        throw error;
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success("Tâche mise à jour avec succès");
      // Récupérer le template_id pour invalider la requête
      const { data: taskData } = await supabase
        .from("project_template_tasks")
        .select("template_id")
        .eq("id", data.id)
        .single();
        
      if (taskData) {
        queryClient.invalidateQueries({ queryKey: ["project-template-tasks", taskData.template_id] });
      }
    },
  });

  // Supprimer une tâche
  const deleteTemplateTask = useMutation({
    mutationFn: async ({ id, template_id }: { id: string, template_id: string }) => {
      const { error } = await supabase
        .from("project_template_tasks")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Erreur lors de la suppression de la tâche");
        throw error;
      }
      
      return { template_id };
    },
    onSuccess: (data) => {
      toast.success("Tâche supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["project-template-tasks", data.template_id] });
    },
  });

  // Récupérer les tâches d'un modèle
  const getTemplateTasks = async (templateId: string) => {
    const { data, error } = await supabase
      .from("project_template_tasks")
      .select("*")
      .eq("template_id", templateId)
      .order("order_index");

    if (error) {
      toast.error("Erreur lors du chargement des tâches");
      throw error;
    }

    return data as ProjectTemplateTask[];
  };

  return {
    templates,
    isLoadingTemplates,
    isLoading,
    getTemplateWithTasks,
    getTemplateTasks,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTemplateTask,
    updateTemplateTask,
    deleteTemplateTask,
  };
};
