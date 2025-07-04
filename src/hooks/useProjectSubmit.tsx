
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectFormState } from "./useProjectFormState";
import { createTasksFromTemplate } from "../utils/templateTasks";
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
        owner_id: formState.ownerId || null,
        // Assignation basée sur l'organisation du chef de projet
        pole_id: pole?.id === "none" ? null : pole?.id || null,
        direction_id: direction?.id === "none" ? null : direction?.id || null,
        service_id: service?.id === "none" ? null : service?.id || null,
        lifecycle_status: formState.lifecycleStatus,
        for_entity_type: formState.forEntityType,
        for_entity_id: formState.forEntityId,
      };

      // Si c'est une mise à jour de projet existant
      if (project?.id) {
        // Mettre à jour le projet principal
        const { error: projectError } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);

        if (projectError) {
          throw projectError;
        }

        // Gestion des données de cadrage si présentes
        if (formState.context || formState.objectives || formState.governance || 
            formState.deliverables || formState.stakeholders || formState.timeline) {
          
          const { error: framingError } = await supabase
            .from("project_framing")
            .upsert({
              project_id: project.id,
              context: formState.context,
              objectives: formState.objectives,
              governance: formState.governance,
              deliverables: formState.deliverables,
              stakeholders: formState.stakeholders,
              timeline: formState.timeline,
            }, {
              onConflict: 'project_id'
            });

          if (framingError) {
            console.error("❌ ProjectSubmit - Erreur cadrage:", framingError);
          }
        }

        // Gestion des scores d'innovation si présents
        if (formState.novateur !== undefined || formState.usager !== undefined || 
            formState.ouverture !== undefined || formState.agilite !== undefined || 
            formState.impact !== undefined) {
          
          const { error: innovationError } = await supabase
            .from("project_innovation_scores")
            .upsert({
              project_id: project.id,
              novateur: formState.novateur || 0,
              usager: formState.usager || 0,
              ouverture: formState.ouverture || 0,
              agilite: formState.agilite || 0,
              impact: formState.impact || 0,
            }, {
              onConflict: 'project_id'
            });

          if (innovationError) {
            console.error("❌ ProjectSubmit - Erreur innovation:", innovationError);
          }
        }

        // Gestion du monitoring si présent
        if (formState.monitoringLevel && formState.monitoringEntityId) {
          const { error: monitoringError } = await supabase
            .from("project_monitoring")
            .upsert({
              project_id: project.id,
              monitoring_level: formState.monitoringLevel,
              monitoring_entity_id: getMonitoringEntityId(formState.monitoringLevel),
            }, {
              onConflict: 'project_id'
            });

          if (monitoringError) {
            console.error("❌ ProjectSubmit - Erreur monitoring:", monitoringError);
          }
        }

        // Invalider les caches spécifiques au projet
        await queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        await queryClient.invalidateQueries({ queryKey: ["projectInnovationScores", project.id] });
        
      } else {
        // Création d'un nouveau projet - utiliser la logique existante
        const result = await onSubmit({
          title: formState.title,
          description: formState.description,
          projectManager: formState.projectManager,
          startDate: formState.startDate,
          endDate: formState.endDate,
          priority: formState.priority,
          monitoringLevel: formState.monitoringLevel,
          monitoringEntityId: getMonitoringEntityId(formState.monitoringLevel),
          owner_id: formState.ownerId || null,
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
          templateId: formState.templateId
        });
        
        // Si un modèle a été sélectionné et qu'il s'agit d'un nouveau projet, créer les tâches
        if (formState.templateId && result && result.id) {
          console.log("Création des tâches à partir du modèle:", formState.templateId, "pour le projet:", result.id);
          const startDateString = formState.startDate ? formState.startDate.toISOString().split('T')[0] : undefined;
          console.log("Date de début utilisée pour les tâches:", startDateString);
          
          const tasksCreated = await createTasksFromTemplate(formState.templateId, result.id, startDateString);
          
          if (tasksCreated) {
            toast({
              title: "Tâches créées",
              description: "Les tâches ont été créées à partir du modèle.",
            });
          }
        }
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
