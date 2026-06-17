
import { useToast } from "@/components/ui/use-toast";
import { ProjectFormState } from "../hooks/useProjectFormState";
import { useState } from "react";
import { AccessibleOrganizations } from "@/types/user";
import { useProjectAccessValidation } from "./useProjectAccessValidation";
import { useProjectSubmit } from "./useProjectSubmit";
import { useUser } from "@/contexts/AuthContext";
import { ProjectRecord, ProjectSubmitCallback } from "@/types/supabase-models";

interface UseProjectFormSubmitProps {
  project?: ProjectRecord;
  canEdit: boolean;
  canCreate: boolean;
  canEditOrganization: boolean;
  formState: ProjectFormState;
  onSubmit: ProjectSubmitCallback;
  onClose: () => void;
  accessibleOrganizations?: AccessibleOrganizations | null;
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

  const {
    showAccessWarning,
    setShowAccessWarning,
    isProceedingAnyway,
    setIsProceedingAnyway,
    willUserStillHaveAccess,
    handleProceedAnyway,
    handleCancelSubmit: baseHandleCancelSubmit
  } = useProjectAccessValidation({ userId: user?.id });

  const { submitProject } = useProjectSubmit({ 
    project, 
    onSubmit, 
    onClose, 
    formState 
  });

  // F-02 : garantir que l'indicateur "Continuer quand même" est réinitialisé
  // lorsqu'on annule, afin d'éviter qu'une future soumission saute le contrôle d'accès.
  const handleCancelSubmit = () => {
    setIsProceedingAnyway(false);
    baseHandleCancelSubmit();
  };

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

    // Vérifier si le chef de projet a changé
    if (project?.id && project.project_manager !== formState.projectManager) {
      const willHaveAccess = await willUserStillHaveAccess(
        user?.id,
        project.id,
        formState.projectManager,
      );

      if (!willHaveAccess && !isProceedingAnyway) {
        setShowAccessWarning(true);
        return;
      }
    }

    // Réinitialiser systématiquement l'indicateur après usage (F-02)
    setIsProceedingAnyway(false);

    await submitProject();
  };


  return { 
    handleSubmit: checkAccessAndSubmit, 
    showAccessWarning,
    handleProceedAnyway,
    handleCancelSubmit
  };
};
