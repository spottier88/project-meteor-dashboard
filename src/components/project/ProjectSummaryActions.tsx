/**
 * @component ProjectSummaryActions
 * @description Actions disponibles sur la vue de résumé d'un projet.
 * Permet d'exporter les informations du projet au format PPTX ou PDF (note de cadrage)
 * en combinant les données du projet, des revues, des risques et des tâches.
 * Inclut également un bouton pour éditer le projet, créer une revue et clôturer le projet.
 * 
 * Interface optimisée : actions principales en icônes avec tooltip, 
 * actions secondaires dans un menu déroulant "Plus d'actions".
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
import { Presentation, FileText, Edit, Calendar, CheckCircle, FileCheck, MoreVertical } from "lucide-react";
import { generateProjectFramingPDF } from "@/components/framing/ProjectFramingExport";
import { generateProjectFramingDOCX } from "@/components/framing/ProjectFramingExportDOCX";
import { FramingExportDialog } from "@/components/framing/FramingExportDialog";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useReviewAccess } from "@/hooks/use-review-access";
import { ProjectClosureDialog } from "./closure/ProjectClosureDialog";
import { ClosurePendingBadge } from "./ClosurePendingBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectSummaryActionsProps {
  project: any;
  risks?: any[];
  tasks?: any[];
  onEditProject?: () => void;
  onCreateReview?: () => void;
  onClosureComplete?: () => void;
}

const ProjectSummaryActions = ({ 
  project, 
  risks = [], 
  tasks = [], 
  onEditProject,
  onCreateReview,
  onClosureComplete,
}: ProjectSummaryActionsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingFraming, setIsExportingFraming] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  
  // Vérifier les permissions pour l'édition
  const { canEdit } = useProjectPermissions(project?.id);
  
  // Vérifier les permissions pour créer une revue
  const { canCreateReview } = useReviewAccess(project?.id);

  // Conditions pour afficher le bouton de clôture
  const canCloseProject = canEdit && project?.lifecycle_status !== 'completed';
  const hasPendingEvaluation = project?.lifecycle_status === 'completed' && project?.closure_status === 'pending_evaluation';
  const lastCompletion = project?.completion || 0;

  // Vérifier si des actions de gestion sont disponibles
  const hasManagementActions = canCloseProject || (hasPendingEvaluation && canEdit);

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
          project_manager_name: detailedProjectData.project?.project_manager_name,
          secondary_managers: detailedProjectData.project?.secondary_managers || [],
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
          difficulties: detailedProjectData.lastReview?.difficulties,
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

  const handleExportFraming = async (format: 'pdf' | 'docx') => {
    try {
      setIsExportingFraming(true);

      const detailedProjectData = await fetchDetailedProject(project.id);
      if (!detailedProjectData) return;

      // Générer le document selon le format choisi
      if (format === 'pdf') {
        await generateProjectFramingPDF(detailedProjectData);
      } else {
        await generateProjectFramingDOCX(detailedProjectData);
      }
      
      toast({
        title: "Export réussi",
        description: `La note de cadrage ${format.toUpperCase()} a été générée avec succès.`,
      });
      
      // Fermer le dialogue
      setShowExportDialog(false);
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'export ${format.toUpperCase()}.`,
        variant: "destructive",
      });
    } finally {
      setIsExportingFraming(false);
    }
  };

  return (
    <>
      <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Badge évaluation en attente */}
        {hasPendingEvaluation && <ClosurePendingBadge />}

        {/* Bouton icône Modifier avec tooltip */}
        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onEditProject}
                variant="outline"
                size="icon"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier le projet</TooltipContent>
          </Tooltip>
        )}

        {/* Bouton icône Nouvelle revue avec tooltip */}
        {canCreateReview && project?.lifecycle_status !== 'completed' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onCreateReview}
                className="bg-blue-600 text-white hover:bg-blue-700" 
                size="icon"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Créer une revue de projet</TooltipContent>
          </Tooltip>
        )}

        {/* Menu déroulant pour les actions secondaires */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Plus d'actions</TooltipContent>
          </Tooltip>
          
          <DropdownMenuContent align="end" className="w-56">
            {/* Groupe Gestion */}
            {hasManagementActions && (
              <>
                <DropdownMenuLabel>Gestion</DropdownMenuLabel>
                {canCloseProject && (
                  <DropdownMenuItem onClick={() => setIsClosureDialogOpen(true)}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Clôturer le projet
                  </DropdownMenuItem>
                )}
                {hasPendingEvaluation && canEdit && (
                  <DropdownMenuItem onClick={() => setIsClosureDialogOpen(true)}>
                    <FileCheck className="h-4 w-4 mr-2 text-orange-600" />
                    Compléter l'évaluation
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Groupe Exports */}
            <DropdownMenuLabel>Exports</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={handleExportPPTX} 
              disabled={isExporting || isExportingFraming}
            >
              <Presentation className="h-4 w-4 mr-2" />
              {isExporting ? "Exportation..." : "Exporter en PPTX"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowExportDialog(true)} 
              disabled={isExporting || isExportingFraming}
            >
              <FileText className="h-4 w-4 mr-2" />
              Note de cadrage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </TooltipProvider>

      <FramingExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExportFraming}
        isExporting={isExportingFraming}
      />

      <ProjectClosureDialog
        projectId={project?.id || ""}
        projectTitle={project?.title || ""}
        isOpen={isClosureDialogOpen}
        onClose={() => setIsClosureDialogOpen(false)}
        onClosureComplete={onClosureComplete}
        lastCompletion={lastCompletion}
        pendingEvaluationMode={hasPendingEvaluation}
      />
    </>
  );
};

export default ProjectSummaryActions;
