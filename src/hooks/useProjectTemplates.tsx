
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ProjectTemplate } from "@/components/templates/ProjectTemplateList";

interface ProjectTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  duration_days?: number;
  order_index: number;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProjectTemplates = (templateId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(templateId);

  // Récupérer tous les modèles
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les modèles de projets",
          variant: "destructive",
        });
        throw error;
      }
      return data as ProjectTemplate[];
    },
  });

  // Récupérer les tâches d'un modèle spécifique
  const { data: templateTasks = [], isLoading: isLoadingTemplateTasks } = useQuery({
    queryKey: ['templateTasks', currentTemplateId || templateId],
    queryFn: async () => {
      const id = currentTemplateId || templateId;
      if (!id) return [];

      const { data, error } = await supabase
        .from('project_template_tasks')
        .select('*')
        .eq('template_id', id)
        .order('parent_task_id', { ascending: true, nullsFirst: true })
        .order('order_index', { ascending: true });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les tâches du modèle",
          variant: "destructive",
        });
        throw error;
      }
      return data as ProjectTemplateTask[];
    },
    enabled: !!currentTemplateId || !!templateId,
  });

  // Créer un nouveau modèle
  const createTemplateMutation = useMutation({
    mutationFn: async (template: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from('project_templates')
        .insert([{
          title: template.title,
          description: template.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
    },
  });

  // Mettre à jour un modèle existant
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: { id: string; title: string; description?: string }) => {
      const { data, error } = await supabase
        .from('project_templates')
        .update({
          title: template.title,
          description: template.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
    },
  });

  // Supprimer un modèle et toutes ses tâches
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Supprimer d'abord les tâches liées au modèle
      await supabase
        .from('project_template_tasks')
        .delete()
        .eq('template_id', id);

      // Ensuite supprimer le modèle
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
    },
  });

  // Créer une nouvelle tâche pour un modèle
  const createTemplateTaskMutation = useMutation({
    mutationFn: async (task: {
      templateId: string;
      title: string;
      description?: string;
      status?: 'todo' | 'in_progress' | 'done';
      duration_days?: number;
      parent_task_id?: string;
    }) => {
      // Récupérer le dernier ordre pour définir le nouvel ordre
      const { data: lastTasks } = await supabase
        .from('project_template_tasks')
        .select('order_index')
        .eq('template_id', task.templateId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = lastTasks && lastTasks.length > 0 ? (lastTasks[0].order_index + 1) : 0;

      const { data, error } = await supabase
        .from('project_template_tasks')
        .insert([{
          template_id: task.templateId,
          title: task.title,
          description: task.description,
          status: task.status || 'todo',
          duration_days: task.duration_days,
          parent_task_id: task.parent_task_id,
          order_index: nextOrderIndex,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateTasks', variables.templateId] });
    },
  });

  // Mettre à jour une tâche existante
  const updateTemplateTaskMutation = useMutation({
    mutationFn: async (task: {
      id: string;
      templateId: string;
      title: string;
      description?: string;
      status?: 'todo' | 'in_progress' | 'done';
      duration_days?: number;
      parent_task_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_template_tasks')
        .update({
          title: task.title,
          description: task.description,
          status: task.status || 'todo',
          duration_days: task.duration_days,
          parent_task_id: task.parent_task_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateTasks', variables.templateId] });
    },
  });

  // Supprimer une tâche et ses sous-tâches
  const deleteTemplateTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      // Récupérer la tâche pour connaître son template_id
      const { data: taskData } = await supabase
        .from('project_template_tasks')
        .select('template_id')
        .eq('id', id)
        .single();

      // Supprimer d'abord les sous-tâches
      await supabase
        .from('project_template_tasks')
        .delete()
        .eq('parent_task_id', id);

      // Ensuite supprimer la tâche elle-même
      const { error } = await supabase
        .from('project_template_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, templateId: taskData?.template_id };
    },
    onSuccess: (data) => {
      if (data && data.templateId) {
        queryClient.invalidateQueries({ queryKey: ['templateTasks', data.templateId] });
      }
    },
  });

  return {
    templates,
    isLoadingTemplates,
    templateTasks,
    isLoadingTemplateTasks,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    createTemplateTask: createTemplateTaskMutation.mutateAsync,
    updateTemplateTask: updateTemplateTaskMutation.mutateAsync,
    deleteTemplateTask: deleteTemplateTaskMutation.mutateAsync,
    isLoadingAction: 
      createTemplateMutation.isLoading || 
      updateTemplateMutation.isLoading || 
      deleteTemplateMutation.isLoading ||
      createTemplateTaskMutation.isLoading ||
      updateTemplateTaskMutation.isLoading ||
      deleteTemplateTaskMutation.isLoading,
    setCurrentTemplateId,
  };
};
