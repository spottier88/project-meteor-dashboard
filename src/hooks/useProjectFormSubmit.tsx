
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectFormState } from "../components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";
import { willUserStillHaveAccess } from "@/utils/projectAccessCheck";
import { useState } from "react";
import { AccessibleOrganizations } from "@/types/user";

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  canEditOrganization: boolean;
  formState: ProjectFormState;
  onSubmit: (projectData: any) => Promise<any>;
  onClose: () => void;
  accessibleOrganizations?: AccessibleOrganizations | null;
}

export const useProjectFormSubmit = ({
  project,
  canEdit,
  canCreate,
  canEditOrganization,
  formState,
  onSubmit,
  onClose,
  accessibleOrganizations
}: UseProjectFormSubmitProps) => {
  const { toast } = useToast();
  const user = useUser();
  const queryClient = useQueryClient();
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [isProceedingAnyway, setIsProceedingAnyway] = useState(false);

  // Fonction pour vérifier si les entités sélectionnées sont accessibles
  const validateOrganizationSelection = (): boolean => {
    if (!accessibleOrganizations) return true;

    // Pour un nouveau projet, vérifier que les entités sélectionnées sont dans le périmètre accessible
    if (formState.poleId !== "none") {
      const isPoleAccessible = accessibleOrganizations.poles.some(p => p.id === formState.poleId);
      if (!isPoleAccessible) {
        toast({
          title: "Erreur",
          description: "Le pôle sélectionné n'est pas dans votre périmètre accessible",
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (formState.directionId !== "none") {
      const isDirectionAccessible = accessibleOrganizations.directions.some(d => d.id === formState.directionId);
      if (!isDirectionAccessible) {
        toast({
          title: "Erreur",
          description: "La direction sélectionnée n'est pas dans votre périmètre accessible",
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (formState.serviceId !== "none") {
      const isServiceAccessible = accessibleOrganizations.services.some(s => s.id === formState.serviceId);
      if (!isServiceAccessible) {
        toast({
          title: "Erreur",
          description: "Le service sélectionné n'est pas dans votre périmètre accessible",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
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

    // Pour un projet existant, vérifier si l'utilisateur peut modifier l'organisation
    if (project?.id && !canEditOrganization && (
      project.pole_id !== formState.poleId ||
      project.direction_id !== formState.directionId ||
      project.service_id !== formState.serviceId
    )) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits nécessaires pour modifier l'organisation de ce projet",
        variant: "destructive",
      });
      return;
    }

    // Valider les sélections d'entités organisationnelles
    if (!validateOrganizationSelection()) {
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
