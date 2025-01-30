import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFormStep1 } from "./form/ProjectFormStep1";
import { ProjectFormStep2 } from "./form/ProjectFormStep2";
import { ProjectFormStep3 } from "./form/ProjectFormStep3";
import { ProjectFormNavigation } from "./form/ProjectFormNavigation";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useProjectFormState } from "./form/useProjectFormState";
import { useProjectFormValidation } from "./form/useProjectFormValidation";
import { getProjectManagers } from "@/utils/projectManagers";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  project?: any;
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const { toast } = useToast();
  const user = useUser();
  const formState = useProjectFormState(isOpen, project);
  const validation = useProjectFormValidation();
  const { isAdmin, userProfile } = usePermissionsContext();

  console.log("ProjectForm - Permissions:", { isAdmin, userEmail: userProfile?.email });
  console.log("ProjectForm - Current project:", project);
  console.log("ProjectForm - Form state:", formState);

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers", user?.id, validation.userRoles],
    queryFn: async () => {
      return getProjectManagers(user?.id, validation.userRoles?.map(ur => ur.role));
    },
    enabled: isOpen && !!user?.id && !!validation.userRoles,
  });

  const handleSubmit = async () => {
    if (!validation.validateStep3()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      console.error("User doesn't have permission to edit project");
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits nécessaires pour modifier ce projet",
        variant: "destructive",
      });
      return;
    }

    formState.setIsSubmitting(true);
    try {
      const projectData = {
        title: formState.title,
        description: formState.description,
        projectManager: formState.projectManager,
        startDate: formState.startDate,
        endDate: formState.endDate,
        priority: formState.priority,
        monitoringLevel: formState.monitoringLevel,
        monitoringEntityId: formState.monitoringEntityId || null,
        ownerId: formState.ownerId || null,
        poleId: formState.poleId === "none" ? null : formState.poleId,
        directionId: formState.directionId === "none" ? null : formState.directionId,
        serviceId: formState.serviceId === "none" ? null : formState.serviceId,
        lifecycleStatus: formState.lifecycleStatus,
        innovation: {
          novateur: formState.novateur,
          usager: formState.usager,
          ouverture: formState.ouverture,
          agilite: formState.agilite,
          impact: formState.impact,
        },
      };

      console.log("Submitting project data:", projectData);

      await onSubmit(projectData);
      
      toast({
        title: "Succès",
        description: project ? "Projet mis à jour" : "Projet créé",
      });
      onClose();
    } catch (error: any) {
      console.error("Error submitting project:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (formState.currentStep === 0 && validation.validateStep1(formState.title, formState.projectManager)) {
      formState.setCurrentStep(1);
    } else if (formState.currentStep === 1 && validation.validateStep2()) {
      formState.setCurrentStep(2);
    } else if (formState.currentStep === 2 && validation.validateStep3()) {
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
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {project ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            {formState.currentStep === 0 
              ? "Étape 1: Informations générales du projet" 
              : formState.currentStep === 1
              ? "Étape 2: Organisation et niveau de suivi"
              : "Étape 3: Critères d'innovation"}
          </DialogDescription>
          <Progress value={(formState.currentStep + 1) * 33.33} className="h-2" />
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {formState.currentStep === 0 ? (
            <ProjectFormStep1
              {...formState}
              isAdmin={validation.isAdmin}
              isManager={validation.isManager}
              projectManagers={projectManagers}
            />
          ) : formState.currentStep === 1 ? (
            <ProjectFormStep2
              {...formState}
              project={project}
            />
          ) : (
            <ProjectFormStep3
              {...formState}
            />
          )}
        </div>
        
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
                : validation.validateStep3()
            }
            isLastStep={formState.currentStep === 2}
            isSubmitting={formState.isSubmitting}
            onClose={onClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
