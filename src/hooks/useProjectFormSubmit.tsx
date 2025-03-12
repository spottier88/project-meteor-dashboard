
import { useState } from "react";
import { ProjectFormState } from "@/components/form/useProjectFormState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
      const projectData = {
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate,
        end_date: formState.endDate,
        priority: formState.priority,
        monitoring_level: formState.monitoringLevel,
        direction_id: formState.directionId,
        pole_id: formState.poleId,
        service_id: formState.serviceId,
        confidentiality: formState.confidentiality,
        budget_impact: formState.budgetImpact,
        reputation_impact: formState.reputationImpact,
        regulatory_impact: formState.regulatoryImpact,
        innovation_level: formState.innovationLevel,
        innovation_types: formState.innovationTypes,
        innovation_objectives: formState.innovationObjectives,
        innovation_scopes: formState.innovationScopes,
        lifecycle_status: formState.lifecycleStatus,
      };

      // Soumettre les données du projet
      await onSubmit(projectData);
      
      const projectId = project?.id || await getNewProjectId(formState.title);
      
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

      // Réinitialisation de l'état et fermeture du formulaire
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
