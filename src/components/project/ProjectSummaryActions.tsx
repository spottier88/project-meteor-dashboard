
/**
 * @component ProjectSummaryActions
 * @description Actions disponibles sur la vue de résumé d'un projet.
 * Permet d'exporter les informations du projet au format PPTX en combinant
 * les données du projet, des revues, des risques et des tâches.
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";
import { ProjectData as PPTXProjectData } from "@/components/pptx/types";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { RiskProbability, RiskSeverity, RiskStatus } from "@/types/risk";
import { useDetailedProjectsData } from "@/hooks/use-detailed-projects-data";

interface ProjectSummaryActionsProps {
  project: any;
  risks?: any[];
  tasks?: any[];
}

const ProjectSummaryActions = ({ project, risks = [], tasks = [] }: ProjectSummaryActionsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPPTX = async () => {
    try {
      setIsExporting(true);

      // Utiliser le hook optimisé pour récupérer les données détaillées du projet
      const { data, error } = await supabase.rpc('get_detailed_projects', { 
        p_project_ids: [project.id] 
      });

      if (error) {
        console.error("Erreur lors de la récupération des données détaillées:", error);
        throw error;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données du projet pour l'export.",
          variant: "destructive",
        });
        return;
      }

      // Parse les données JSON si nécessaire
      const detailedProjectData = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0];

      // Adapter les données pour respecter le format PPTXProjectData
      const projectData: PPTXProjectData = {
        project: {
          title: detailedProjectData.project?.title || "",
          status: (detailedProjectData.project?.status || "cloudy") as ProjectStatus,
          progress: (detailedProjectData.project?.progress || "stable") as ProgressStatus,
          completion: detailedProjectData.project?.completion || 0,
          project_manager: detailedProjectData.project?.project_manager,
          last_review_date: detailedProjectData.project?.last_review_date,
          start_date: detailedProjectData.project?.start_date,
          end_date: detailedProjectData.project?.end_date,
          description: detailedProjectData.project?.description,
          pole_name: detailedProjectData.project?.pole_name,
          direction_name: detailedProjectData.project?.direction_name,
          service_name: detailedProjectData.project?.service_name,
          lifecycle_status: detailedProjectData.project?.lifecycle_status as ProjectLifecycleStatus,
        },
        lastReview: detailedProjectData.lastReview ? {
          weather: (detailedProjectData.lastReview?.weather || "cloudy") as ProjectStatus,
          progress: (detailedProjectData.lastReview?.progress || "stable") as ProgressStatus,
          comment: detailedProjectData.lastReview?.comment,
          created_at: detailedProjectData.lastReview?.created_at,
          actions: detailedProjectData.lastReview?.actions || []
        } : undefined,
        risks: (detailedProjectData.risks || []).map((risk: any) => ({
          description: risk.description,
          probability: risk.probability as RiskProbability,
          severity: risk.severity as RiskSeverity,
          status: risk.status as RiskStatus,
          mitigation_plan: risk.mitigation_plan
        })),
        tasks: (detailedProjectData.tasks || []).map((task: any) => ({
          title: task.title,
          description: task.description,
          status: task.status as "todo" | "in_progress" | "done",
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
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex space-x-4">
      <Button 
        onClick={handleExportPPTX}
        disabled={isExporting}
      >
        {isExporting ? "Exportation..." : "Exporter en PPTX"}
      </Button>
    </div>
  );
};

export default ProjectSummaryActions;
