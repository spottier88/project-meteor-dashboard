
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export const useProjectFormHandlers = (selectedProject?: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Fonction pour enregistrer les données de cadrage
  const saveFramingData = async (projectId: string, framingData: any) => {
    const { error } = await supabase
      .from("project_framing")
      .upsert({
        project_id: projectId,
        context: framingData.context,
        stakeholders: framingData.stakeholders,
        governance: framingData.governance,
        objectives: framingData.objectives,
        timeline: framingData.timeline,
        deliverables: framingData.deliverables,
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
  };

  // Fonction pour enregistrer les scores d'innovation
  const saveInnovationData = async (projectId: string, innovationData: any) => {
    const { error } = await supabase
      .from("project_innovation_scores")
      .upsert({
        project_id: projectId,
        novateur: innovationData.novateur || 0,
        usager: innovationData.usager || 0,
        ouverture: innovationData.ouverture || 0,
        agilite: innovationData.agilite || 0,
        impact: innovationData.impact || 0,
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
  };

  // Fonction pour enregistrer les données de monitoring
  const saveMonitoringData = async (projectId: string, monitoringData: any) => {
    if (monitoringData.monitoring_level) {
      const { error } = await supabase
        .from("project_monitoring")
        .upsert({
          project_id: projectId,
          monitoring_level: monitoringData.monitoring_level,
          monitoring_entity_id: monitoringData.monitoring_entity_id,
        }, {
          onConflict: 'project_id'
        });

      if (error) throw error;
    }
  };

  const handleProjectFormSubmit = async (projectData: any) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Séparer les données principales des données annexes
      const {
        framing,
        innovation,
        monitoring_level,
        monitoring_entity_id,
        templateId,
        ...mainProjectData
      } = projectData;

      // Données principales du projet
      const coreProjectData = {
        title: mainProjectData.title,
        description: mainProjectData.description,
        project_manager: mainProjectData.project_manager,
        project_manager_id: mainProjectData.project_manager_id,
        pole_id: mainProjectData.pole_id,
        direction_id: mainProjectData.direction_id,
        service_id: mainProjectData.service_id,
        start_date: mainProjectData.start_date,
        end_date: mainProjectData.end_date,
        for_entity_type: mainProjectData.for_entity_type,
        for_entity_id: mainProjectData.for_entity_id,
        priority: mainProjectData.priority,
        lifecycle_status: mainProjectData.lifecycle_status,
      };

      let projectId: string;

      // Si c'est une modification
      if (selectedProject?.id) {
        const { error } = await supabase
          .from("projects")
          .update(coreProjectData)
          .eq("id", selectedProject.id);

        if (error) throw error;
        projectId = selectedProject.id;

        toast({
          title: "Projet modifié",
          description: "Le projet a été modifié avec succès",
        });
      } else {
        // Si c'est une création
        const { data, error } = await supabase
          .from("projects")
          .insert({
            ...coreProjectData,
            owner_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        projectId = data.id;

        toast({
          title: "Projet créé",
          description: "Le projet a été créé avec succès",
        });
      }

      // Enregistrer les données annexes si elles existent
      if (framing) {
        await saveFramingData(projectId, framing);
      }

      if (innovation) {
        await saveInnovationData(projectId, innovation);
      }

      if (monitoring_level) {
        await saveMonitoringData(projectId, {
          monitoring_level,
          monitoring_entity_id
        });
      }

      // Retourner l'ID du projet pour que useProjectSubmit puisse l'utiliser
      return { id: projectId };

    } catch (error) {
      console.error("Erreur lors de la soumission du projet:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleProjectFormSubmit,
    isSubmitting,
  };
};
