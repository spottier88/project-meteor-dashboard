
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectFormState } from "./useProjectFormState";
import { createTasksFromTemplate } from "../utils/templateTasks";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

interface UseProjectSubmitProps {
  project?: any;
  onSubmit: (projectData: any) => Promise<any>;
  onClose: () => void;
  formState: ProjectFormState;
}

export const useProjectSubmit = ({
  project,
  onSubmit,
  onClose,
  formState
}: UseProjectSubmitProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fonction pour enregistrer les données de cadrage
  const saveFramingData = async (projectId: string) => {
    const framingData = {
      project_id: projectId,
      context: formState.context,
      stakeholders: formState.stakeholders,
      governance: formState.governance,
      objectives: formState.objectives,
      timeline: formState.timeline,
      deliverables: formState.deliverables,
    };

    const { error } = await supabase
      .from("project_framing")
      .upsert(framingData, {
        onConflict: 'project_id'
      });

    if (error) {
      logger.error("Erreur lors de l'enregistrement des données de cadrage:", error.message);
      throw error;
    }
  };

  // Fonction pour enregistrer les scores d'innovation
  const saveInnovationData = async (projectId: string) => {
    const innovationData = {
      project_id: projectId,
      novateur: formState.novateur,
      usager: formState.usager,
      ouverture: formState.ouverture,
      agilite: formState.agilite,
      impact: formState.impact,
    };

    const { error } = await supabase
      .from("project_innovation_scores")
      .upsert(innovationData, {
        onConflict: 'project_id'
      });

    if (error) {
      logger.error("Erreur lors de l'enregistrement des scores d'innovation:", error.message);
      throw error;
    }
  };

  // Fonction pour enregistrer les données de monitoring
  const saveMonitoringData = async (projectId: string) => {
    // Déterminer les IDs des entités organisationnelles à partir de l'organisation du chef de projet
    const { pole, direction, service } = formState.projectManagerOrganization;
    
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

    const monitoringData = {
      project_id: projectId,
      monitoring_level: formState.monitoringLevel,
      monitoring_entity_id: getMonitoringEntityId(formState.monitoringLevel),
    };

    const { error } = await supabase
      .from("project_monitoring")
      .upsert(monitoringData, {
        onConflict: 'project_id'
      });

    if (error) {
      logger.error("Erreur lors de l'enregistrement des données de monitoring:", error.message);
      throw error;
    }
  };

  const submitProject = async () => {
    formState.setIsSubmitting(true);
    try {
      // Déterminer les IDs des entités organisationnelles à partir de l'organisation du chef de projet
      const { pole, direction, service } = formState.projectManagerOrganization;

      // Données principales du projet (table projects uniquement)
      const projectData = {
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate?.toISOString().split('T')[0],
        end_date: formState.endDate?.toISOString().split('T')[0],
        priority: formState.priority,
        owner_id: formState.ownerId || null,
        // Assignation basée sur l'organisation du chef de projet - utiliser les bons noms de colonnes
        pole_id: pole?.id || null,
        direction_id: direction?.id || null,
        service_id: service?.id || null,
        lifecycle_status: formState.lifecycleStatus,
        for_entity_type: formState.forEntityType,
        for_entity_id: formState.forEntityId,
      };

      console.log("Soumission des données du projet:", projectData);

      // Soumettre les données du projet principal
      const result = await onSubmit(projectData);
      
      console.log("Résultat de onSubmit:", result);
      
      // Vérifier que nous avons un résultat valide avec un ID
      let projectId = null;
      
      if (result && typeof result === 'object') {
        // Si result est un objet, chercher l'ID
        projectId = result.id || result[0]?.id;
      } else if (project?.id) {
        // Si c'est une mise à jour, utiliser l'ID du projet existant
        projectId = project.id;
      }
      
      if (!projectId) {
        console.error("Impossible de récupérer l'ID du projet. Résultat:", result);
        throw new Error("Impossible de récupérer l'ID du projet après la création/mise à jour");
      }

      console.log("ID du projet récupéré:", projectId);

      // Enregistrer les données annexes dans les tables spécialisées
      await Promise.all([
        saveFramingData(projectId),
        saveInnovationData(projectId),
        saveMonitoringData(projectId)
      ]);
      
      // Si un modèle a été sélectionné et qu'il s'agit d'un nouveau projet, créer les tâches
      if (formState.templateId && projectId) {
        logger.debug(
          "Création des tâches à partir du modèle:",
          formState.templateId,
          "pour le projet:",
          projectId
        );
        // Nous passons explicitement formState.startDate pour utiliser la date saisie par l'utilisateur
        const startDateString = formState.startDate
          ? formState.startDate.toISOString().split('T')[0]
          : undefined;
        logger.debug("Date de début utilisée pour les tâches:", startDateString);
        
        const tasksCreated = await createTasksFromTemplate(formState.templateId, projectId, startDateString);
        
        if (tasksCreated) {
          toast({
            title: "Tâches créées",
            description: "Les tâches ont été créées à partir du modèle.",
          });
        }
      } else {
        logger.debug(
          "Pas de création de tâches - templateId:",
          formState.templateId,
          "project:",
          projectId
        );
      }
      
      // Invalider toutes les requêtes liées aux projets pour forcer un rafraîchissement
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      // Invalider spécifiquement la vue liste des projets pour la page d'accueil
      await queryClient.invalidateQueries({ queryKey: ["projectsListView"] });
      
      // Réinitialiser l'indicateur de modifications non enregistrées
      formState.resetHasUnsavedChanges();
      
      toast({
        title: "Succès",
        description: project ? "Projet mis à jour" : "Projet créé",
      });
      onClose();
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la soumission du projet:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
      return false;
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return { submitProject };
};
