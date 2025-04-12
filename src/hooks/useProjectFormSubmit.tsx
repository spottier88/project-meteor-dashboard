
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

  // Fonction pour vérifier si une entité est accessible en tenant compte de la hiérarchie
  const isEntityAccessible = (entityType: string, entityId: string): boolean => {
    if (!accessibleOrganizations) return true;
    
    if (entityType === 'pole') {
      return accessibleOrganizations.poles.some(p => p.id === entityId);
    } 
    else if (entityType === 'direction') {
      // Vérifier si la direction est directement accessible
      if (accessibleOrganizations.directions.some(d => d.id === entityId)) {
        return true;
      }
      
      // Si la direction n'est pas directement accessible, vérifier si son pôle parent est accessible
      // Note: nous devons faire une requête pour trouver le pôle parent
      return false; // Nous allons gérer ce cas dans validateOrganizationSelection
    } 
    else if (entityType === 'service') {
      // Vérifier si le service est directement accessible
      if (accessibleOrganizations.services.some(s => s.id === entityId)) {
        return true;
      }
      
      // Si le service n'est pas directement accessible, nous vérifierons sa hiérarchie dans validateOrganizationSelection
      return false;
    }
    
    return false;
  };

  // Fonction pour vérifier si les entités sélectionnées sont accessibles
  const validateOrganizationSelection = async (): Promise<boolean> => {
    if (!accessibleOrganizations) return true;

    // Vérifions l'accès en tenant compte de la hiérarchie
    const hierarchyCheck = {
      poleAccessible: true,
      directionAccessible: true,
      serviceAccessible: true
    };

    // Vérification pour le pôle
    if (formState.poleId !== "none") {
      hierarchyCheck.poleAccessible = isEntityAccessible('pole', formState.poleId);
      if (!hierarchyCheck.poleAccessible) {
        toast({
          title: "Erreur",
          description: "Le pôle sélectionné n'est pas dans votre périmètre accessible",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Vérification pour la direction
    if (formState.directionId !== "none") {
      // Vérifier d'abord l'accès direct à la direction
      hierarchyCheck.directionAccessible = isEntityAccessible('direction', formState.directionId);
      
      // Si pas d'accès direct, vérifier si le pôle parent est accessible
      if (!hierarchyCheck.directionAccessible && formState.poleId !== "none" && hierarchyCheck.poleAccessible) {
        // Si le pôle sélectionné est accessible et est bien le parent de cette direction,
        // alors on considère que la direction est accessible par héritage
        const { data: direction } = await supabase
          .from("directions")
          .select("pole_id")
          .eq("id", formState.directionId)
          .single();
          
        if (direction && direction.pole_id === formState.poleId) {
          hierarchyCheck.directionAccessible = true;
        }
      }
      
      if (!hierarchyCheck.directionAccessible) {
        toast({
          title: "Erreur",
          description: "La direction sélectionnée n'est pas dans votre périmètre accessible",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Vérification pour le service
    if (formState.serviceId !== "none") {
      // Vérifier d'abord l'accès direct au service
      hierarchyCheck.serviceAccessible = isEntityAccessible('service', formState.serviceId);
      
      // Si pas d'accès direct, vérifier la hiérarchie
      if (!hierarchyCheck.serviceAccessible) {
        const { data: service } = await supabase
          .from("services")
          .select(`
            direction_id,
            directions:direction_id (
              pole_id
            )
          `)
          .eq("id", formState.serviceId)
          .single();
          
        if (service) {
          // Vérifier si la direction parente est accessible (soit directement, soit par héritage)
          if (formState.directionId !== "none" && service.direction_id === formState.directionId && hierarchyCheck.directionAccessible) {
            hierarchyCheck.serviceAccessible = true;
          }
          // Ou vérifier si le pôle parent est accessible
          else if (formState.poleId !== "none" && service.directions && 
                  service.directions.pole_id === formState.poleId && 
                  hierarchyCheck.poleAccessible) {
            hierarchyCheck.serviceAccessible = true;
          }
        }
      }
      
      if (!hierarchyCheck.serviceAccessible) {
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

    // Valider les sélections d'entités organisationnelles en tenant compte de la hiérarchie
    if (!(await validateOrganizationSelection())) {
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
