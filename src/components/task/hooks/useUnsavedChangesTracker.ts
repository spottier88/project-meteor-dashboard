
import { useState, useEffect } from "react";

interface UseUnsavedChangesTrackerParams {
  task?: {
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    due_date?: string;
    start_date?: string;
    assignee?: string;
    parent_task_id?: string;
    document_url?: string;
    completion_comment?: string;
  };
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  dueDate?: Date;
  startDate?: Date;
  assignee: string;
  parentTaskId?: string;
  documentUrl: string;
  completionComment: string;
  isSubmitting: boolean;
}

export const useUnsavedChangesTracker = ({
  task,
  title,
  description,
  status,
  dueDate,
  startDate,
  assignee,
  parentTaskId,
  documentUrl,
  completionComment,
  isSubmitting
}: UseUnsavedChangesTrackerParams) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fonction pour réinitialiser l'état des modifications non enregistrées
  const resetHasUnsavedChanges = () => {
    setHasUnsavedChanges(false);
  };

  // Ajouter des effets pour suivre les modifications
  useEffect(() => {
    if (task) {
      const originalTitle = task.title || "";
      const originalDescription = task.description || "";
      const originalStatus = task.status || "todo";
      const originalDueDate = task.due_date ? new Date(task.due_date).toISOString() : undefined;
      const originalStartDate = task.start_date ? new Date(task.start_date).toISOString() : undefined;
      const originalAssignee = task.assignee || "";
      const originalParentTaskId = task.parent_task_id;
      const originalDocumentUrl = task.document_url || "";
      const originalCompletionComment = task.completion_comment || "";
      
      const currentStartDate = startDate?.toISOString();
      const currentDueDate = dueDate?.toISOString();
      
      // Vérifier s'il y a des modifications par rapport aux valeurs d'origine
      const hasChanges = 
        title !== originalTitle || 
        description !== originalDescription ||
        status !== originalStatus ||
        (currentDueDate !== originalDueDate) ||
        (currentStartDate !== originalStartDate) ||
        assignee !== originalAssignee ||
        parentTaskId !== originalParentTaskId ||
        documentUrl !== originalDocumentUrl ||
        completionComment !== originalCompletionComment;
      
      setHasUnsavedChanges(hasChanges);
    } else if (title || description || assignee || dueDate || startDate || status !== "todo" || parentTaskId || documentUrl || completionComment) {
      // Pour les nouvelles tâches, vérifier s'il y a des saisies
      setHasUnsavedChanges(true);
    }
  }, [title, description, status, dueDate, startDate, assignee, parentTaskId, documentUrl, completionComment, task]);

  // Ne pas suivre les changements pendant la soumission
  useEffect(() => {
    if (isSubmitting) {
      setHasUnsavedChanges(false);
    }
  }, [isSubmitting]);

  return {
    hasUnsavedChanges,
    resetHasUnsavedChanges
  };
};
