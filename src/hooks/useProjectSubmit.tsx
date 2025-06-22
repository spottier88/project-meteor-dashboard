
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectFormState } from "./useProjectFormState";
import { createTasksFromTemplate } from "../utils/templateTasks";
import { logger } from "@/utils/logger";

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

  const submitProject = async () => {
    formState.setIsSubmitting(true);
    try {
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

      const projectData = {
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate?.toISOString().split('T')[0],
        end_date: formState.endDate?.toISOString().split('T')[0],
        priority: formState.priority,
        monitoring_level: formState.monitoringLevel,
        monitoring_entity_id: getMonitoringEntityId(formState.monitoringLevel),
        owner_id: formState.ownerId || null,
        // Assignation basée sur l'organisation du chef de projet - utiliser les bons noms de colonnes
        pole_id: pole?.id || null,
        direction_id: direction?.id || null,
        service_id: service?.id || null,
        lifecycle_status: formState.lifecycleStatus,
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
        templateId: formState.templateId
      };

      // Soumettre les données du projet
      const result = await onSubmit(projectData);
      
      // Si un modèle a été sélectionné et qu'il s'agit d'un nouveau projet, créer les tâches
      if (formState.templateId && result && result.id) {
        logger.debug(
          "Création des tâches à partir du modèle:",
          formState.templateId,
          "pour le projet:",
          result.id
        );
        // Nous passons explicitement formState.startDate pour utiliser la date saisie par l'utilisateur
        const startDateString = formState.startDate
          ? formState.startDate.toISOString().split('T')[0]
          : undefined;
        logger.debug("Date de début utilisée pour les tâches:", startDateString);
        
        const tasksCreated = await createTasksFromTemplate(formState.templateId, result.id, startDateString);
        
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
          result?.id
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
