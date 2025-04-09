
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
import { ProfileForm } from "./profile/ProfileForm";
import { UserProfile } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";

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
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

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

  const handleOpenProfile = () => {
    setIsProfileFormOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto" onInteractOutside={e => {
          if (formState.hasUnsavedChanges) {
            e.preventDefault();
          }
        }}>
          <ProjectFormHeader 
            currentStep={formState.currentStep} 
            isEditMode={!!project}
            title={formState.title}
          />
          <ProjectFormContent 
            canEditOrganization={canEditOrganization} 
            formState={formState}
            projectManagers={projectManagers}
            project={project}
            isEditMode={!!project}
            onOpenProfile={handleOpenProfile}
          />
          <DialogFooter>
            <ProjectFormNavigation 
              currentStep={formState.currentStep}
              isSubmitting={formState.isSubmitting}
              onPrevious={handlePrevious}
              onNext={handleNext}
              isEditMode={!!project}
              onClose={handleCloseRequest}
              isLastStep={formState.currentStep === 3}
              canGoNext={formState.currentStep === 0 ? !!formState.title && !!formState.projectManager : true}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir fermer ce formulaire ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showAccessWarning} onOpenChange={(open) => {
        if (!open) handleCancelSubmit();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Attention au changement d'attribution</AlertDialogTitle>
            <AlertDialogDescription>
              L'organisation que vous avez sélectionnée ne correspond pas à vos droits d'accès.
              Si vous continuez, vous pourriez perdre la capacité de gérer ce projet ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubmit}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedAnyway}>Continuer quand même</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {profile && (
        <ProfileForm 
          isOpen={isProfileFormOpen} 
          onClose={() => setIsProfileFormOpen(false)} 
          profile={profile}
        />
      )}
    </>
  );
};
