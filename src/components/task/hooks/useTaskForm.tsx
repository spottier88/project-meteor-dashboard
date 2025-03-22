
import { useTaskFormInitialization } from "./useTaskFormInitialization";
import { useUnsavedChangesTracker } from "./useUnsavedChangesTracker";
import { useTaskSubmit } from "./useTaskSubmit";
import { UseTaskFormParams, TaskData } from "../types/TaskFormTypes";

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
    setParentTaskId
  } = useTaskFormInitialization({ task, projectMembers });

  // Gestion de la soumission du formulaire
  const { isSubmitting, handleSubmit: submitTask } = useTaskSubmit({
    projectId,
    taskId: task?.id,
    onClose,
    onSubmit,
    resetHasUnsavedChanges: () => trackerState.resetHasUnsavedChanges()
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
    isSubmitting
  });

  // Fonction principale de soumission qui prépare les données avant de les envoyer
  const handleSubmit = async () => {
    const taskData: TaskData = {
      title,
      description,
      status,
      due_date: dueDate?.toISOString().split('T')[0],
      start_date: startDate?.toISOString().split('T')[0],
      assignee,
      parent_task_id: parentTaskId === "none" ? null : parentTaskId || null,
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
    hasUnsavedChanges: trackerState.hasUnsavedChanges,
    resetHasUnsavedChanges: trackerState.resetHasUnsavedChanges,
    handleSubmit,
  };
};
