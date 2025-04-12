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

  // Fonction pour vérifier si une entité est directement accessible
  const isEntityDirectlyAccessible = (entityType: string, entityId: string): boolean => {
    if (!accessibleOrganizations) return true;
    
    if (entityType === 'pole') {
      return accessibleOrganizations.poles.some(p => p.id === entityId);
    } 
    else if (entityType === 'direction') {
      return accessibleOrganizations.directions.some(d => d.id === entityId);
    } 
    else if (entityType === 'service') {
      return accessibleOrganizations.services.some(s => s.id === entityId);
    }
    
    return false;
  };

  // Fonction pour vérifier si les entités sélectionnées sont accessibles
  const validateOrganizationSelection = async (): Promise<boolean> => {
    if (!accessibleOrganizations) return true;

    // Vérifions l'accès en tenant compte de la hiérarchie descendante uniquement
    const hierarchyCheck = {
      poleAccessible: true,
      directionAccessible: true,
      serviceAccessible: true
    };

    // Vérification pour le pôle - accès direct uniquement
    if (formState.poleId !== "none") {
      hierarchyCheck.poleAccessible = isEntityDirectlyAccessible('pole', formState.poleId);
      
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
      hierarchyCheck.directionAccessible = isEntityDirectlyAccessible('direction', formState.directionId);
      
      // Si pas d'accès direct, vérifier la hiérarchie descendante
      if (!hierarchyCheck.directionAccessible) {
        // Récupérer le pôle parent de cette direction
        const { data: direction } = await supabase
          .from("directions")
          .select("pole_id")
          .eq("id", formState.directionId)
          .single();
        
        // Vérifier si l'utilisateur a accès au pôle parent de cette direction
        if (direction && direction.pole_id) {
          // L'utilisateur a accès à la direction si et seulement si il a accès direct au pôle parent
          if (isEntityDirectlyAccessible('pole', direction.pole_id)) {
            hierarchyCheck.directionAccessible = true;
          }
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
      hierarchyCheck.serviceAccessible = isEntityDirectlyAccessible('service', formState.serviceId);
      
      // Si pas d'accès direct, vérifier la hiérarchie descendante
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
          // L'utilisateur a accès au service si:
          // 1. Il a accès direct à la direction parente
          if (service.direction_id && isEntityDirectlyAccessible('direction', service.direction_id)) {
            hierarchyCheck.serviceAccessible = true;
          } 
          // 2. Ou s'il a accès direct au pôle parent
          else if (service.directions?.pole_id && isEntityDirectlyAccessible('pole', service.directions.pole_id)) {
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
