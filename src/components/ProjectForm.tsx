import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ProjectFormFields } from "./form/ProjectFormFields";
import { ProjectFormActions } from "./form/ProjectFormActions";
import { ProjectFormNavigation } from "./form/ProjectFormNavigation";
import { useProjectFormState } from "./form/useProjectFormState";
import { useProjectFormValidation } from "./form/useProjectFormValidation";
import { getProjectManagers } from "@/utils/projectManagers";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  project?: any;
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formState = useProjectFormState(isOpen, project);
  const { isAdmin, isManager, userProfile } = usePermissionsContext();
  const { canEdit } = useProjectPermissions(project?.id || "");
  const validation = useProjectFormValidation(formState, userProfile);

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers", user?.id],
    queryFn: () => getProjectManagers(user?.id),
    enabled: !!user?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile?.email) {
      console.error("No user email found");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
      return;
    }

    if (!canEdit) {
      console.error("User doesn't have permission to edit project");
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits nécessaires pour modifier ce projet",
        variant: "destructive",
      });
      return;
    }

    const validationError = validation.validateForm();
    if (validationError) {
      toast({
        title: "Erreur de validation",
        description: validationError,
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
        monitoringEntityId: formState.monitoringEntityId,
        ownerId: formState.ownerId,
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

      await onSubmit(projectData);
      
      // Invalider le cache des projets après une mise à jour réussie
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Invalider aussi le cache des dernières revues qui est utilisé dans l'affichage des projets
      await queryClient.invalidateQueries({ queryKey: ["latestReview"] });
      
      toast({
        title: project ? "Projet modifié" : "Projet créé",
        description: project
          ? "Le projet a été modifié avec succès"
          : "Le projet a été créé avec succès",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du projet",
        variant: "destructive",
      });
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <ProjectFormNavigation
            currentStep={formState.currentStep}
            onPrevious={() => formState.setCurrentStep(formState.currentStep - 1)}
            onNext={() => formState.setCurrentStep(formState.currentStep + 1)}
            canGoNext={true}
            isLastStep={formState.currentStep === 2}
            isSubmitting={formState.isSubmitting}
            onClose={onClose}
          />
          <ProjectFormFields
            title={formState.title}
            setTitle={formState.setTitle}
            description={formState.description}
            setDescription={formState.setDescription}
            projectManager={formState.projectManager}
            setProjectManager={formState.setProjectManager}
            startDate={formState.startDate}
            setStartDate={formState.setStartDate}
            endDate={formState.endDate}
            setEndDate={formState.setEndDate}
            priority={formState.priority}
            setPriority={formState.setPriority}
            monitoringLevel={formState.monitoringLevel}
            setMonitoringLevel={formState.setMonitoringLevel}
            monitoringEntityId={formState.monitoringEntityId}
            setMonitoringEntityId={formState.setMonitoringEntityId}
            currentStep={formState.currentStep}
            projectManagers={projectManagers || []}
            isAdmin={isAdmin}
            isManager={isManager}
          />
          <ProjectFormActions
            isSubmitting={formState.isSubmitting}
            onClose={onClose}
            onSubmit={handleSubmit}
            project={project}
            formData={formState}
            user={user}
            isAdmin={isAdmin}
            isManager={isManager}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};