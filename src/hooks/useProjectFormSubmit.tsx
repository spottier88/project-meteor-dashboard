import { useState } from "react";
import { ProjectFormState } from "@/components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  formState: ProjectFormState;
  onSubmit: (projectData: any) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const isEditing = !!project;

    // Vérifier les autorisations
    logger.debug("Vérification des autorisations", "project-form", { isEditing, canEdit, canCreate });

    if (isEditing && !canEdit) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas l'autorisation de modifier ce projet.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && !canCreate) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas l'autorisation de créer un projet.",
        variant: "destructive",
      });
      return;
    }

    // Mise à jour de l'état isSubmitting
    formState.setIsSubmitting(true);
    setIsSubmitting(true);

    try {
      // Préparation des données du projet
      const projectPayload = {
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate,
        end_date: formState.endDate,
        priority: formState.priority,
        owner_id: formState.owner_id,
        pole_id: formState.poleId === "none" ? null : formState.poleId,
        direction_id: formState.directionId === "none" ? null : formState.directionId,
        service_id: formState.serviceId === "none" ? null : formState.serviceId,
        lifecycle_status: formState.lifecycleStatus,
      };

      logger.info("Payload du projet à envoyer", "project-form", {
        projectPayload,
        isEditing,
        projectId: project?.id
      });

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);
      
      logger.debug("Rôles de l'utilisateur", "project-form", { userRoles, error: rolesError });

      if (isEditing) {
        logger.info("Mise à jour du projet", "project-form", { projectId: project.id });
        const { data: updatedProject, error: projectError } = await supabase
          .from("projects")
          .update(projectPayload)
          .eq("id", project.id)
          .select();

        logger.debug("Résultat de la mise à jour", "project-form", { updatedProject, error: projectError });

        if (projectError) {
          logger.error("Erreur lors de la mise à jour du projet", "project-form", projectError);
          throw projectError;
        }

        // Mise à jour du cadrage pour un projet existant ou nouveau
        await supabase
          .from('project_framing')
          .upsert({
            project_id: project.id,
            context: formState.context,
            stakeholders: formState.stakeholders,
            governance: formState.governance,
            objectives: formState.objectives,
            timeline: formState.timeline,
            deliverables: formState.deliverables,
          }, { onConflict: 'project_id' });
          
        // Mise à jour des scores d'innovation
        await supabase
          .from('project_innovation_scores')
          .upsert({
            project_id: project.id,
            novateur: formState.novateur,
            usager: formState.usager,
            ouverture: formState.ouverture,
            agilite: formState.agilite,
            impact: formState.impact,
          }, { onConflict: 'project_id' });

      } else {
        logger.info("Création d'un nouveau projet", "project-form");
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert(projectPayload)
          .select()
          .single();

        logger.debug("Résultat de la création", "project-form", { newProject, error: projectError });

        if (projectError) {
          logger.error("Erreur lors de la création du projet", "project-form", {
            error: projectError,
            payload: projectPayload
          });
          throw projectError;
        }

        const projectId = newProject?.id || await getNewProjectId(formState.title);
      
        if (projectId) {
          // Mise à jour du cadrage pour un projet existant ou nouveau
          await supabase
            .from('project_framing')
            .upsert({
              project_id: projectId,
              context: formState.context,
              stakeholders: formState.stakeholders,
              governance: formState.governance,
              objectives: formState.objectives,
              timeline: formState.timeline,
              deliverables: formState.deliverables,
            }, { onConflict: 'project_id' });
            
          // Mise à jour des scores d'innovation
          await supabase
            .from('project_innovation_scores')
            .upsert({
              project_id: projectId,
              novateur: formState.novateur,
              usager: formState.usager,
              ouverture: formState.ouverture,
              agilite: formState.agilite,
              impact: formState.impact,
            }, { onConflict: 'project_id' });
        }
      }

      logger.info("Opération sur le projet terminée avec succès", "project-form");
      
      toast({
        title: isEditing ? "Projet mis à jour" : "Projet créé",
        description: isEditing
          ? "Le projet a été mis à jour avec succès."
          : "Le projet a été créé avec succès.",
      });
      
      formState.setIsSubmitting(false);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      logger.error("Échec de l'opération sur le projet", "project-form", { error });
      console.error("Erreur lors de la soumission :", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement du projet.",
        variant: "destructive",
      });
      formState.setIsSubmitting(false);
      setIsSubmitting(false);
    }
  };
  
  // Fonction pour récupérer l'ID du projet nouvellement créé
  const getNewProjectId = async (title: string) => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('title', title)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      return data?.id;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'ID du projet:", error);
      return null;
    }
  };

  return {
    handleSubmit,
    isSubmitting,
  };
};
