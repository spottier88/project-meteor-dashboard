
import { useTaskFormInitialization } from "./useTaskFormInitialization";
import { useUnsavedChangesTracker } from "./useUnsavedChangesTracker";
import { useTaskSubmit } from "./useTaskSubmit";
import { UseTaskFormParams, TaskData } from "../types/TaskFormTypes";
import { format } from "date-fns";

export const useTaskForm = ({
  projectId,
  task,
  onClose,
  onSubmit = () => {},
  projectMembers
}: UseTaskFormParams) => {
  // Initialisation des valeurs du formulaire
  const {
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
    parentTaskId,
    setParentTaskId,
    documentUrl,
    setDocumentUrl,
    completionComment,
    setCompletionComment,
    resetForm
  } = useTaskFormInitialization({ task, projectMembers });

  // Gestion de la soumission du formulaire
  const { isSubmitting, handleSubmit: submitTask } = useTaskSubmit({
    projectId,
    taskId: task?.id,
    onClose,
    onSubmit,
    resetHasUnsavedChanges: () => trackerState.resetHasUnsavedChanges(),
    resetForm
  });

  // Suivi des modifications non enregistrées
  const trackerState = useUnsavedChangesTracker({
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
  });

  // Fonction principale de soumission qui prépare les données avant de les envoyer
  const handleSubmit = async () => {
    // Formatage des dates pour préserver le jour local, sans conversion UTC
    const formatLocalDate = (date?: Date) => {
      if (!date) return undefined;
      // Format YYYY-MM-DD sans conversion de timezone
      return format(date, 'yyyy-MM-dd');
    };

    const taskData: TaskData = {
      title,
      description,
      status,
      due_date: formatLocalDate(dueDate),
      start_date: formatLocalDate(startDate),
      assignee,
      parent_task_id: parentTaskId === "none" ? null : parentTaskId || null,
      document_url: documentUrl.trim() || null,
      completion_comment: status === "done" ? (completionComment.trim() || null) : null,
    };

    await submitTask(taskData);
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
    documentUrl,
    setDocumentUrl,
    completionComment,
    setCompletionComment,
    hasUnsavedChanges: trackerState.hasUnsavedChanges,
    resetHasUnsavedChanges: trackerState.resetHasUnsavedChanges,
    handleSubmit,
  };
};
