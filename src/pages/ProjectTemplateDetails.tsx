
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectTemplates } from '@/hooks/useProjectTemplates';
import { TemplateTaskList } from '@/components/templates/TemplateTaskList';
import { TemplateTaskDialog } from '@/components/templates/TemplateTaskDialog';
import { useToast } from "@/components/ui/use-toast";

export const ProjectTemplateDetails = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const { 
    templates,
    isLoadingTemplates,
    templateTasks,
    isLoadingTemplateTasks,
    createTemplateTask,
    updateTemplateTask,
    deleteTemplateTask,
    isLoadingAction
  } = useProjectTemplates(templateId);

  const currentTemplate = templates.find(t => t.id === templateId);

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    durationDays: number;
    parentTaskId?: string;
  }) => {
    if (!templateId) return;
    
    try {
      await createTemplateTask({
        templateId,
        title: data.title,
        description: data.description,
        status: data.status,
        duration_days: data.durationDays,
        parent_task_id: data.parentTaskId
      });
      
      toast({
        title: "Tâche créée",
        description: "La tâche a été ajoutée au modèle avec succès.",
      });
      // Fermer la boîte de dialogue après la création réussie
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (data: {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    durationDays: number;
    parentTaskId?: string;
  }) => {
    if (!templateId || !data.id) return;
    
    try {
      await updateTemplateTask({
        id: data.id,
        templateId,
        title: data.title,
        description: data.description,
        status: data.status,
        duration_days: data.durationDays,
        parent_task_id: data.parentTaskId
      });
      
      toast({
        title: "Tâche modifiée",
        description: "La tâche a été modifiée avec succès.",
      });
      // Assurons-nous de réinitialiser l'état de modification et de fermer la boîte de dialogue
      setEditingTask(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la modification de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTemplateTask(id);
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée du modèle avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la tâche.",
        variant: "destructive",
      });
    }
  };

  // Filtrer les tâches parent potentielles (exclure la tâche en cours d'édition et les sous-tâches)
  const getParentTaskOptions = () => {
    if (!templateTasks) return [];

    return templateTasks
      .filter(task => !task.parent_task_id && (!editingTask || task.id !== editingTask.id))
      .map(task => ({
        value: task.id,
        label: task.title
      }));
  };

  if (isLoadingTemplates || (templateId && !currentTemplate)) {
    return <div className="container mx-auto py-8 px-4">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin/templates")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux modèles
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {currentTemplate?.title || 'Modèle de projet'}
        </h1>
        <p className="text-muted-foreground">
          {currentTemplate?.description || 'Description du modèle'}
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tâches du modèle</h2>
        <Button onClick={() => {
          setEditingTask(null);
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une tâche
        </Button>
      </div>

      <TemplateTaskList
        tasks={templateTasks || []}
        isLoading={isLoadingTemplateTasks || isLoadingAction}
        onEdit={(task) => {
          setEditingTask({
            id: task.id,
            title: task.title,
            description: task.description || "",
            status: task.status,
            durationDays: task.duration_days || 0,
            parentTaskId: task.parent_task_id
          });
          setIsDialogOpen(true);
        }}
        onDelete={handleDeleteTask}
        onOpenDialog={() => {
          setEditingTask(null);
          setIsDialogOpen(true);
        }}
      />

      <TemplateTaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Réinitialiser l'état d'édition lorsque la boîte de dialogue est fermée
            setEditingTask(null);
          }
          setIsDialogOpen(open);
        }}
        parentTaskOptions={getParentTaskOptions()}
        defaultValues={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        title={editingTask ? "Modifier la tâche" : "Ajouter une tâche au modèle"}
      />
    </div>
  );
};
