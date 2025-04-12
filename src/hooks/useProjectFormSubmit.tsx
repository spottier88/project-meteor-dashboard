
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectFormState } from "../components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";
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
      // Vérifier si l'utilisateur aura toujours accès après la modification
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

    // Réinitialiser l'indicateur pour les futures soumissions
    setIsProceedingAnyway(false);
    
    // Continuer avec la soumission
    submitProject();
  };

  // Fonction pour vérifier si l'utilisateur aura toujours accès après modification
  const willUserStillHaveAccess = async (
    userId: string | undefined,
    projectId: string,
    newProjectManager: string,
  ): Promise<boolean> => {
    if (!userId) return false;

    // Si l'utilisateur est le nouveau chef de projet, il aura toujours accès
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (userProfile?.email === newProjectManager) {
      return true;
    }

    // Vérifier si l'utilisateur est admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (userRoles?.some(ur => ur.role === 'admin')) {
      return true;
    }

    // Vérifier si l'utilisateur est membre du projet
    const { data: isMember } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    return !!isMember;
  };

  const submitProject = async () => {
    formState.setIsSubmitting(true);
    try {
      // Déterminer les IDs des entités organisationnelles à partir de l'organisation du chef de projet
      const { pole, direction, service } = formState.projectManagerOrganization;
      
      const projectData = {
        title: formState.title,
        description: formState.description,
        projectManager: formState.projectManager,
        startDate: formState.startDate,
        endDate: formState.endDate,
        priority: formState.priority,
        monitoringLevel: formState.monitoringLevel,
        monitoringEntityId: getMonitoringEntityId(formState.monitoringLevel),
        owner_id: user?.id || null,
        // Assignation basée sur l'organisation du chef de projet
        poleId: pole?.id || null,
        directionId: direction?.id || null,
        serviceId: service?.id || null,
        lifecycleStatus: formState.lifecycleStatus,
        for_entity_type: formState.forEntityType,
        for_entity_id: formState.forEntityId,
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

      // Fonction pour obtenir l'ID de l'entité de suivi en fonction du niveau
      function getMonitoringEntityId(level: string) {
        switch (level) {
          case 'pole':
            return pole?.id || null;
          case 'direction':
            return direction?.id || null;
          default:
            return null;
        }
      }

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
