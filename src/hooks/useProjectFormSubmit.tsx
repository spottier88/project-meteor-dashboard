
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectFormState } from "../components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";
import { willUserStillHaveAccess } from "@/utils/projectAccessCheck";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  formState: ProjectFormState;
  onSubmit: (projectData: any) => Promise<any>;
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
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [isProceedingAnyway, setIsProceedingAnyway] = useState(false);

  const checkAccessAndSubmit = async () => {
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

    // Vérifier si le chef de projet ou l'organisation a changé
    if (project?.id && (
      project.project_manager !== formState.projectManager ||
      project.pole_id !== formState.poleId ||
      project.direction_id !== formState.directionId ||
      project.service_id !== formState.serviceId
    )) {
      // Vérifier si l'utilisateur aura toujours accès après la modification
      const willHaveAccess = await willUserStillHaveAccess(
        user?.id,
        project.id,
        formState.projectManager,
        formState.poleId === "none" ? null : formState.poleId,
        formState.directionId === "none" ? null : formState.directionId,
        formState.serviceId === "none" ? null : formState.serviceId,
      );

      if (!willHaveAccess && !isProceedingAnyway) {
        setShowAccessWarning(true);
        return;
      }
    }

    // Réinitialiser l'indicateur pour les futures soumissions
    setIsProceedingAnyway(false);
    
    // Continuer avec la soumission
    submitProject();
  };

  const submitProject = async () => {
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
      
      // Réinitialiser l'indicateur de modifications non enregistrées
      formState.resetHasUnsavedChanges();
      
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

  const handleProceedAnyway = () => {
    setIsProceedingAnyway(true);
    setShowAccessWarning(false);
    submitProject();
  };

  const handleCancelSubmit = () => {
    setShowAccessWarning(false);
  };

  return { 
    handleSubmit: checkAccessAndSubmit, 
    showAccessWarning,
    handleProceedAnyway,
    handleCancelSubmit
  };
};
