
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
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => Promise<void>;  // Modifié ici pour retourner Promise<void>
  project?: any;
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const user = useUser();
  const formState = useProjectFormState(isOpen, project);
  const validation = useProjectFormValidation();
  const { canEdit, canCreate } = useProjectPermissions(project?.id || "");

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers", user?.id, validation.userRoles],
    queryFn: async () => {
      return getProjectManagers(user?.id, validation.userRoles?.map(ur => ur.role));
    },
    enabled: isOpen && !!user?.id && !!validation.userRoles,
  });

  const { handleSubmit } = useProjectFormSubmit({
    project,
    canEdit,
    canCreate,
    formState,
    onSubmit,
    onClose,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] h-[80vh] flex flex-col">
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
        />
        
        <DialogFooter>
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
            onClose={onClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
