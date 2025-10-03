/**
 * @component ProjectSummaryActions
 * @description Actions disponibles sur la vue de résumé d'un projet.
 * Permet d'exporter les informations du projet au format PPTX ou PDF (note de cadrage)
 * en combinant les données du projet, des revues, des risques et des tâches.
 * Inclut également un bouton pour éditer le projet et créer une revue.
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";
import { ProjectData as PPTXProjectData } from "@/components/pptx/types";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { RiskProbability, RiskSeverity, RiskStatus } from "@/types/risk";
import { useDetailedProjectsData, ProjectData } from "@/hooks/use-detailed-projects-data";
import { Presentation, FileText, Edit, Calendar } from "lucide-react";
import { generateProjectFramingPDF } from "@/components/framing/ProjectFramingExport";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useReviewAccess } from "@/hooks/use-review-access";

interface ProjectSummaryActionsProps {
  project: any;
  risks?: any[];
  tasks?: any[];
  onEditProject?: () => void;
  onCreateReview?: () => void;
}

const ProjectSummaryActions = ({ 
  project, 
  risks = [], 
  tasks = [], 
  onEditProject,
  onCreateReview 
}: ProjectSummaryActionsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Vérifier les permissions pour l'édition
  const { canEdit } = useProjectPermissions(project?.id);
  
  // Vérifier les permissions pour créer une revue
  const { canCreateReview } = useReviewAccess(project?.id);

  const fetchDetailedProject = async (projectId: string): Promise<ProjectData | null> => {
    try {
      // Récupérer les données détaillées du projet via RPC
      const { data, error } = await supabase.rpc('get_detailed_projects', { 
        p_project_ids: [projectId] 
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
        return null;
      }

      // Parse les données JSON si nécessaire et retourner la première entrée
      const projectData = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0];
      return projectData as ProjectData;
    } catch (error) {
      console.error("Erreur lors de la récupération des données du projet:", error);
      throw error;
    }
  };

  const handleExportPPTX = async () => {
    try {
      setIsExporting(true);

      const detailedProjectData = await fetchDetailedProject(project.id);
      if (!detailedProjectData) return;

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

  const handleExportFramingPDF = async () => {
    try {
      setIsExportingPDF(true);

      const detailedProjectData = await fetchDetailedProject(project.id);
      if (!detailedProjectData) return;

      // Générer le PDF avec les données détaillées du projet
      await generateProjectFramingPDF(detailedProjectData);
      
      toast({
        title: "Export réussi",
        description: "La note de cadrage PDF a été générée avec succès.",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex space-x-4">
      {canEdit && (
        <Button 
          onClick={onEditProject}
          variant="outline"
          className="flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      )}
      {canCreateReview && (
        <Button 
          onClick={onCreateReview}
          className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700" 
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Nouvelle revue
        </Button>
      )}
      <Button 
        onClick={handleExportPPTX}
        disabled={isExporting || isExportingPDF}
        className="flex items-center"
      >
        <Presentation className="h-4 w-4 mr-2" />
        {isExporting ? "Exportation..." : "Exporter en PPTX"}
      </Button>
      <Button
        onClick={handleExportFramingPDF}
        disabled={isExporting || isExportingPDF}
        variant="outline"
        className="flex items-center"
      >
        <FileText className="h-4 w-4 mr-2" />
        {isExportingPDF ? "Génération..." : "Note de cadrage PDF"}
      </Button>
    </div>
  );
};

export default ProjectSummaryActions;
