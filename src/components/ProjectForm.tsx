
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectFormHeader } from "./form/ProjectFormHeader";
import { ProjectFormContent } from "./form/ProjectFormContent";
import { ProjectFormNavigation } from "./form/ProjectFormNavigation";
import { useProjectFormState } from "./form/useProjectFormState";
import { useProjectFormValidation } from "./form/useProjectFormValidation";
import { useProjectFormSubmit } from "@/hooks/useProjectFormSubmit";
import { getProjectManagers } from "@/utils/projectManagers";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => Promise<any>;
  project?: any;
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const user = useUser();
  const formState = useProjectFormState(isOpen, project);
  const validation = useProjectFormValidation();
  const { canEdit, canCreate, canEditOrganization, accessibleOrganizations } = useProjectPermissions(project?.id || "");
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers", user?.id, validation.userRoles],
    queryFn: async () => {
      return getProjectManagers(user?.id, validation.userRoles?.map(ur => ur.role));
    },
    enabled: isOpen && !!user?.id && !!validation.userRoles,
  });

  const { 
    handleSubmit, 
    showAccessWarning, 
    handleProceedAnyway, 
    handleCancelSubmit 
  } = useProjectFormSubmit({
    project,
    canEdit,
    canCreate,
    canEditOrganization,
    formState,
    onSubmit,
    onClose: () => {
      formState.resetHasUnsavedChanges();
      onClose();
    },
    accessibleOrganizations
  });

  const handleNext = () => {
    if (formState.currentStep === 0 && validation.validateStep1(formState.title, formState.projectManager)) {
      formState.setCurrentStep(1);
    } else if (formState.currentStep === 1 && validation.validateStep2()) {
      formState.setCurrentStep(2);
    } else if (formState.currentStep === 2 && validation.validateStep3()) {
      formState.setCurrentStep(3);
    } else if (formState.currentStep === 3) {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (formState.currentStep > 0) {
      formState.setCurrentStep(formState.currentStep - 1);
    }
  };

  const handleCloseRequest = () => {
    if (formState.hasUnsavedChanges && !formState.isSubmitting) {
      setShowUnsavedChangesAlert(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedChangesAlert(false);
    formState.resetHasUnsavedChanges();
    onClose();
  };

  const handleCancelClose = () => {
    setShowUnsavedChangesAlert(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[800px] h-[80vh] flex flex-col p-6">
          <ProjectFormHeader 
            currentStep={formState.currentStep}
            isEditing={!!project}
          />
          
          <ProjectFormContent
            currentStep={formState.currentStep}
            formState={formState}
            isAdmin={validation.isAdmin}
            isManager={validation.isManager}
            projectManagers={projectManagers}
            project={project}
            canEditOrganization={canEditOrganization}
          />
          
          <DialogFooter className="mt-6">
            <ProjectFormNavigation
              currentStep={formState.currentStep}
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoNext={
                formState.currentStep === 0 
                  ? validation.validateStep1(formState.title, formState.projectManager)
                  : formState.currentStep === 1 
                  ? validation.validateStep2()
                  : formState.currentStep === 2 
                  ? validation.validateStep3()
                  : true
              }
              isLastStep={formState.currentStep === 3}
              isSubmitting={formState.isSubmitting}
              onClose={handleCloseRequest}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerte pour les modifications non enregistrées */}
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

      {/* Alerte pour la perte d'accès au projet */}
      <AlertDialog open={showAccessWarning} onOpenChange={handleCancelSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Attention - Perte d'accès</AlertDialogTitle>
            <AlertDialogDescription>
              Après cette modification, vous n'aurez plus accès à ce projet.
              Êtes-vous sûr de vouloir continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubmit}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedAnyway} className="bg-red-600 hover:bg-red-700">
              Continuer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
