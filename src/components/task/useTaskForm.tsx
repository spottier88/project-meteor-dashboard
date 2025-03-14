
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface TaskData {
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  start_date?: string;
  assignee?: string;
  parent_task_id?: string | null;
  id?: string;
}

interface UseTaskFormParams {
  projectId: string;
  task?: {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    due_date?: string;
    start_date?: string;
    assignee?: string;
    parent_task_id?: string;
  };
  onClose: () => void;
  onSubmit?: () => void;
  projectMembers?: Array<{
    user_id: string;
    profiles: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    }
  }> | null;
}

export const useTaskForm = ({
  projectId,
  task,
  onClose,
  onSubmit = () => {},
  projectMembers
}: UseTaskFormParams) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = usePermissionsContext();
  
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">(task?.status || "todo");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.start_date ? new Date(task.start_date) : undefined
  );
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [assignmentMode, setAssignmentMode] = useState<"free" | "member">("free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(task?.parent_task_id);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setStartDate(task.start_date ? new Date(task.start_date) : undefined);
      setAssignee(task.assignee || "");
      setParentTaskId(task.parent_task_id);
      
      // Détermine si l'assigné est un membre du projet ou une saisie libre
      const isMember = projectMembers?.some(m => m.profiles.email === task.assignee);
      setAssignmentMode(isMember ? "member" : "free");
      
      console.log(`Initialisation du formulaire pour la tâche ${task.id}, assignee: ${task.assignee}, mode: ${isMember ? "member" : "free"}`);
    } else {
      resetForm();
      
      // Pour les nouvelles tâches, utiliser "member" par défaut si des membres sont disponibles
      if (projectMembers && projectMembers.length > 0) {
        setAssignmentMode("member");
      }
    }
  }, [task, projectMembers]);

  // Log des membres disponibles pour debug
  useEffect(() => {
    if (projectMembers) {
      console.log(`useTaskForm: ${projectMembers.length} membres disponibles pour le projet ${projectId}`);
      if (isAdmin || isManager) {
        console.log('Utilisateur est admin ou manager, tous les membres devraient être visibles');
      }
    }
  }, [projectMembers, projectId, isAdmin, isManager]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setDueDate(undefined);
    setStartDate(undefined);
    setAssignee("");
    setAssignmentMode("free");
    setParentTaskId(undefined);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis",
        variant: "destructive",
      });
      return;
    }

    if (startDate && dueDate && startDate > dueDate) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date d'échéance",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Saving task with parent_task_id:", parentTaskId === "none" ? null : parentTaskId || null);
      const taskData: TaskData = {
        title,
        description,
        status,
        due_date: dueDate?.toISOString().split('T')[0],
        start_date: startDate?.toISOString().split('T')[0],
        assignee,
        parent_task_id: parentTaskId === "none" ? null : parentTaskId || null,
      };

      if (task?.id) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);

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
        resetForm();
      }

      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks-for-parent", projectId] });
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
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
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    dueDate,
    setDueDate,
    startDate,
    setStartDate,
    assignee,
    setAssignee,
    assignmentMode,
    setAssignmentMode,
    isSubmitting,
    parentTaskId,
    setParentTaskId,
    handleSubmit,
  };
};
