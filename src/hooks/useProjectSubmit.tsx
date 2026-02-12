
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectFormState } from "@/components/form/useProjectFormState";
import { createTasksFromTemplate } from "../utils/templateTasks";
import { supabase } from "@/integrations/supabase/client";
import { saveInnovationScores, saveMonitoring, saveFraming, savePortfolios } from "@/utils/projectSubmitHelpers";

interface UseProjectSubmitProps {
  project?: any;
  onSubmit?: (projectData: any) => Promise<any>;
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

  /** Retourne l'ID de l'entité de suivi en fonction du niveau de monitoring */
  const getMonitoringEntityId = (level: string): string | null => {
    const { pole, direction } = formState.projectManagerOrganization;
    switch (level) {
      case 'pole': return pole?.id || null;
      case 'direction': return direction?.id || null;
      default: return null;
    }
  };

  const submitProject = async () => {
    formState.setIsSubmitting(true);
    try {
      const warnings: string[] = [];
      const { pole, direction, service } = formState.projectManagerOrganization;

      const projectData = {
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate?.toISOString().split('T')[0],
        end_date: formState.endDate?.toISOString().split('T')[0],
        priority: formState.priority,
        owner_id: formState.ownerId || null,
        pole_id: pole?.id === "none" ? null : pole?.id || null,
        direction_id: direction?.id === "none" ? null : direction?.id || null,
        service_id: service?.id === "none" ? null : service?.id || null,
        lifecycle_status: formState.lifecycleStatus,
        for_entity_type: formState.forEntityType,
        for_entity_id: formState.forEntityId,
        teams_url: formState.teamsUrl?.trim() || null,
      };

      if (project?.id) {
        // --- Mise à jour d'un projet existant ---
        const { error: projectError } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);

        if (projectError) throw projectError;

        // Sauvegardes annexes (cadrage, innovation, monitoring, portefeuilles)
        // Collecter les avertissements pour informer l'utilisateur
        const framingResult = await saveFraming(project.id, formState, "upsert");
        if (framingResult.warning) warnings.push(framingResult.warning);
        const innovationResult = await saveInnovationScores(project.id, formState, "upsert");
        if (innovationResult.warning) warnings.push(innovationResult.warning);
        const monitoringResult = await saveMonitoring(project.id, formState, getMonitoringEntityId, "upsert");
        if (monitoringResult.warning) warnings.push(monitoringResult.warning);

        if (formState.portfolioIds !== undefined) {
          const portfolioResult = await savePortfolios(project.id, formState.portfolioIds, formState.ownerId || null, "sync");
          if (portfolioResult.warning) warnings.push(portfolioResult.warning);
        }

        // Invalider les caches spécifiques au projet
        await queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        await queryClient.invalidateQueries({ queryKey: ["projectInnovationScores", project.id] });
        await queryClient.invalidateQueries({ queryKey: ["project-monitoring", project.id] });
        
      } else {
        // --- Création d'un nouveau projet ---
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert(projectData)
          .select()
          .single();

        if (projectError) throw projectError;

        const projectId = newProject.id;

        // Sauvegardes annexes
        const innResult = await saveInnovationScores(projectId, formState, "insert");
        if (innResult.warning) warnings.push(innResult.warning);
        const monResult = await saveMonitoring(projectId, formState, getMonitoringEntityId, "insert");
        if (monResult.warning) warnings.push(monResult.warning);
        const frmResult = await saveFraming(projectId, formState, "insert");
        if (frmResult.warning) warnings.push(frmResult.warning);
        const prtResult = await savePortfolios(projectId, formState.portfolioIds, formState.ownerId || null, "insert");
        if (prtResult.warning) warnings.push(prtResult.warning);

        // Callback de compatibilité
        if (onSubmit) {
          await onSubmit(newProject);
        }

        // Création des tâches depuis le modèle si sélectionné
        if (formState.templateId) {
          const startDateString = formState.startDate ? formState.startDate.toISOString().split('T')[0] : undefined;
          const tasksCreated = await createTasksFromTemplate(formState.templateId, projectId, startDateString);
          
          if (tasksCreated) {
            toast({
              title: "Tâches créées",
              description: "Les tâches ont été créées à partir du modèle.",
            });
          }
        }
      }
      
      // Invalider les caches globaux
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["projectsListView"] });
      await queryClient.invalidateQueries({ queryKey: ["project-portfolios"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      
      formState.resetHasUnsavedChanges();
      
      // Afficher les avertissements éventuels pour les sauvegardes annexes
      if (warnings.length > 0) {
        toast({
          title: "Attention",
          description: warnings.join(" "),
          variant: "destructive",
        });
      }

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
