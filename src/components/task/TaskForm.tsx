
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTaskForm } from "./useTaskForm";
import { TaskFormProps } from "./TaskFormTypes";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useTaskFormData } from "@/hooks/use-task-form-data";
import { TaskFormContent } from "./TaskFormContent";

export const TaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit = () => {}, 
  projectId, 
  task,
  readOnlyFields = false
}: TaskFormProps) => {
  const { isAdmin, isManager } = usePermissionsContext();
  
  // Utilisation du hook personnalisé pour récupérer les données
  const { 
    projectMembers,
    projectTasks,
    tasksLoading
  } = useTaskFormData(projectId, isOpen, task?.id);

  // Use the custom hook for form state and logic
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
    isSubmitting,
    parentTaskId,
    setParentTaskId,
    handleSubmit,
  } = useTaskForm({
    projectId,
    task,
    onClose,
    onSubmit,
    projectMembers
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>
        
        <TaskFormContent
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          status={status}
          setStatus={setStatus}
          dueDate={dueDate}
          setDueDate={setDueDate}
          startDate={startDate}
          setStartDate={setStartDate}
          assignee={assignee}
          setAssignee={setAssignee}
          assignmentMode={assignmentMode}
          setAssignmentMode={setAssignmentMode}
          parentTaskId={parentTaskId}
          setParentTaskId={setParentTaskId}
          projectTasks={projectTasks}
          tasksLoading={tasksLoading}
          projectMembers={projectMembers}
          readOnlyFields={readOnlyFields}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Enregistrement..."
            ) : task ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
