
/**
 * @component ProjectSummaryActions
 * @description Actions disponibles sur la vue de résumé d'un projet.
 * Permet d'exporter les informations du projet au format PPTX en combinant
 * les données du projet, des revues, des risques et des tâches.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";
import { ProjectData as PPTXProjectData } from "@/components/pptx/types";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";

interface ProjectSummaryActionsProps {
  project: any;
  risks?: any[];
  tasks?: any[];
}

const ProjectSummaryActions = ({ project, risks = [], tasks = [] }: ProjectSummaryActionsProps) => {
  const { toast } = useToast();

  const handleExportPPTX = async () => {
    try {
      // Récupérer la dernière revue avec ses actions associées
      const { data: lastReview, error: reviewError } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (reviewError && reviewError.code !== 'PGRST116') {
        // PGRST116 est le code "No rows returned", ce n'est pas une erreur critique
        console.error("Erreur lors de la récupération de la revue:", reviewError);
        throw reviewError;
      }

      // Si une revue a été trouvée, récupérer ses actions
      let reviewActions = [];
      if (lastReview) {
        const { data: actions, error: actionsError } = await supabase
          .from("review_actions")
          .select("*")
          .eq("review_id", lastReview.id);

        if (actionsError) {
          console.error("Erreur lors de la récupération des actions:", actionsError);
          throw actionsError;
        }

        reviewActions = actions || [];
      }

      // Adapter les données pour respecter le format PPTXProjectData
      const projectData: PPTXProjectData = {
        project: {
          title: project.title,
          status: (project.status || "cloudy") as ProjectStatus,
          progress: (project.progress || "stable") as ProgressStatus,
          completion: project.completion || 0,
          project_manager: project.project_manager,
          last_review_date: project.last_review_date,
          start_date: project.start_date,
          end_date: project.end_date,
          description: project.description,
          pole_name: project.poles?.name,
          direction_name: project.directions?.name,
          service_name: project.services?.name,
          lifecycle_status: project.lifecycle_status as ProjectLifecycleStatus,
        },
        lastReview: lastReview ? {
          weather: (lastReview.weather || "cloudy") as ProjectStatus,
          progress: (lastReview.progress || "stable") as ProgressStatus,
          comment: lastReview.comment,
          created_at: lastReview.created_at,
          actions: reviewActions.map(action => ({
            description: action.description
          }))
        } : undefined,
        risks: risks.map(risk => ({
          description: risk.description,
          probability: risk.probability,
          severity: risk.severity,
          status: risk.status,
          mitigation_plan: risk.mitigation_plan
        })),
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description,
          status: task.status,
          assignee: task.assignee,
          due_date: task.due_date
        })),
      };

      await generateProjectPPTX([projectData]);
      toast({
        title: "Export réussi",
        description: "Le fichier PPTX a été généré avec succès.",
      });
    } catch (error) {
      console.error("Error exporting to PPTX:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export PPTX.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex space-x-4">
      <Button onClick={handleExportPPTX}>Exporter en PPTX</Button>
    </div>
  );
};

export default ProjectSummaryActions;
