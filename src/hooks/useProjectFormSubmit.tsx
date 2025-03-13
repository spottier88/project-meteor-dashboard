
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectFormState } from "../components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  formState: ProjectFormState;
  onSubmit: (projectData: any) => Promise<any>; // Modifié pour permettre un retour
  onClose: () => void;
}

export const useProjectFormSubmit = ({
  project,
  canEdit,
  canCreate,
  formState,
  onSubmit,
  onClose,
}: UseProjectFormSubmitProps) => {
  const { toast } = useToast();
  const user = useUser();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!formState.validateStep3()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (project?.id && !canEdit) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits nécessaires pour modifier ce projet",
        variant: "destructive",
      });
      return;
    }

    if (!project?.id && !canCreate) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits nécessaires pour créer un projet",
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
        owner_id: user?.id || null,
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
        framing: {
          context: formState.context,
          stakeholders: formState.stakeholders,
          governance: formState.governance,
          objectives: formState.objectives,
          timeline: formState.timeline,
          deliverables: formState.deliverables,
        },
      };

      // Soumettre les données du projet
      const result = await onSubmit(projectData);
      
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      toast({
        title: "Succès",
        description: project ? "Projet mis à jour" : "Projet créé",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};
