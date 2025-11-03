import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { TaskData } from "../types/TaskFormTypes";
import { logger } from "@/utils/logger";

interface UseTaskSubmitParams {
  projectId: string;
  taskId?: string;
  onClose: () => void;
  onSubmit?: () => void;
  resetHasUnsavedChanges: () => void;
  resetForm: () => void;
}

export const useTaskSubmit = ({
  projectId,
  taskId,
  onClose,
  onSubmit = () => {},
  resetHasUnsavedChanges,
  resetForm
}: UseTaskSubmitParams) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (taskData: TaskData) => {
    if (!taskData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis",
        variant: "destructive",
      });
      return;
    }

    if (taskData.start_date && taskData.due_date && new Date(taskData.start_date) > new Date(taskData.due_date)) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date d'échéance",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (taskId) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", taskId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La tâche a été mise à jour",
        });
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert({
            ...taskData,
            project_id: projectId,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La tâche a été créée",
        });
        
        // Réinitialiser le formulaire après création d'une nouvelle tâche
        resetForm();
      }

      // Rafraîchir toutes les queries de tâches (incluant aggregatedTasks pour les projets maîtres)
      await queryClient.refetchQueries({
        predicate: (query) =>
          query.queryKey[0] === "tasks" ||
          query.queryKey[0] === "aggregatedTasks" ||
          query.queryKey[0] === "project-tasks-for-parent"
      });
      
      resetHasUnsavedChanges();
      
      onSubmit();
      onClose();
    } catch (error) {
      logger.error("Erreur lors de la soumission de la tâche:" + error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
