
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTaskForm } from "./useTaskForm";
import { TaskFormProps } from "./TaskFormTypes";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useTaskFormData } from "@/hooks/useTaskFormData";
import { TaskFormContent } from "./TaskFormContent";
import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const TaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit = () => {}, 
  projectId, 
  task,
  readOnlyFields = false
}: TaskFormProps) => {
  const { isAdmin, isManager } = usePermissionsContext();
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  
  // Utiliser useMemo pour stabiliser les valeurs et éviter les re-rendus excessifs
  const permissions = useMemo(() => ({ 
    isAdmin, 
    isManager 
  }), [isAdmin, isManager]);
  
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
    hasUnsavedChanges,
    resetHasUnsavedChanges,
    handleSubmit,
  } = useTaskForm({
    projectId,
    task,
    onClose,
    onSubmit,
    projectMembers
  });

  // Fonction pour gérer la demande de fermeture
  const handleCloseRequest = () => {
    if (hasUnsavedChanges && !isSubmitting) {
      setShowUnsavedChangesAlert(true);
    } else {
      onClose();
    }
  };

  // Fonctions pour gérer la confirmation de fermeture
  const handleConfirmClose = () => {
    setShowUnsavedChangesAlert(false);
    resetHasUnsavedChanges();
    onClose();
  };

  const handleCancelClose = () => {
    setShowUnsavedChangesAlert(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
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
            <Button variant="outline" onClick={handleCloseRequest}>
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

      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter sans enregistrer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
