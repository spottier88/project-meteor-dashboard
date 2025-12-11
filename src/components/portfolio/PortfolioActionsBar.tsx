/**
 * @file PortfolioActionsBar.tsx
 * @description Barre d'actions unifiée pour le portefeuille.
 * Regroupe les exports du portefeuille (synthèse) et les exports des revues de projets
 * avec une séparation visuelle claire.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, GanttChartSquare, FileSpreadsheet, Presentation, Download, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDetailedProjectsData, ProjectData } from "@/hooks/use-detailed-projects-data";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";
import { generatePortfolioPPTX } from "@/components/pptx/portfolioSlideGenerators";
import { generatePortfolioExcel } from "@/utils/portfolioExport";
import { exportProjectsToExcel } from "@/utils/projectExport";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { PortfolioGanttSheet } from "./PortfolioGanttSheet";
import { ProjectData as PPTXProjectData } from "@/components/pptx/types";
import { ProjectStatus, ProgressStatus } from "@/types/project";

interface PortfolioActionsBarProps {
  /** Données complètes du portefeuille pour l'export */
  portfolioData: {
    id: string;
    name: string;
    description: string | null;
    strategic_objectives: string | null;
    budget_total: number | null;
    start_date: string | null;
    end_date: string | null;
    status: string | null;
    project_count: number;
    average_completion: number;
    projects: any[];
    statusStats: any;
    lifecycleStats: any;
  };
  /** Indique si l'utilisateur peut gérer le portefeuille */
  canManage?: boolean;
}

/**
 * Barre d'actions unifiée regroupant :
 * - Les exports du portefeuille (synthèse)
 * - Les exports et actions sur les revues de projets
 */
export const PortfolioActionsBar = ({ portfolioData, canManage = false }: PortfolioActionsBarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  const projectIds = portfolioData.projects.map((p) => p.id);

  // Hook pour charger les données détaillées des projets (à la demande)
  const { refetch, isLoading: isLoadingDetails } = useDetailedProjectsData(
    projectIds,
    false, // Ne pas charger automatiquement
  );

  /**
   * Adapte les données au format attendu par le générateur PPTX
   */
  const adaptDataForPPTX = (data: ProjectData[]): PPTXProjectData[] => {
    return data.map((item) => ({
      project: {
        ...item.project,
        status: item.project.status || ("cloudy" as ProjectStatus),
        progress: item.project.progress || ("stable" as ProgressStatus),
        lifecycle_status: item.project.lifecycle_status,
      },
      lastReview: item.lastReview
        ? {
            ...item.lastReview,
            weather: item.lastReview.weather || ("cloudy" as ProjectStatus),
            progress: item.lastReview.progress || ("stable" as ProgressStatus),
            actions: item.lastReview.actions || [],
          }
        : undefined,
      risks: item.risks.map((risk) => ({
        description: risk.description,
        probability: risk.probability,
        severity: risk.severity,
        status: risk.status,
        mitigation_plan: risk.mitigation_plan,
      })),
      tasks: item.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: task.status as "todo" | "in_progress" | "done",
        assignee: task.assignee,
        due_date: task.due_date,
      })),
    }));
  };

  // ===== Exports Portefeuille (synthèse) =====

  /**
   * Export Excel du portefeuille (synthèse)
   */
  const handlePortfolioExcelExport = async () => {
    try {
      setExportType("portfolio-excel");
      setIsExporting(true);
      await generatePortfolioExcel(portfolioData);
      toast({
        title: "Export Excel réussi",
        description: `Le portefeuille "${portfolioData.name}" a été exporté au format Excel`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel du portefeuille:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export Excel",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  /**
   * Export PowerPoint du portefeuille (synthèse)
   */
  const handlePortfolioPPTXExport = async () => {
    try {
      setExportType("portfolio-pptx");
      setIsExporting(true);
      await generatePortfolioPPTX(portfolioData);
      toast({
        title: "Export PowerPoint réussi",
        description: `Le portefeuille "${portfolioData.name}" a été exporté au format PowerPoint`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export PPTX du portefeuille:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export PowerPoint",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // ===== Exports Revues de Projets =====

  /**
   * Export Excel des revues de projets
   */
  const handleProjectsExcelExport = async () => {
    if (projectIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à exporter.",
      });
      return;
    }

    try {
      setExportType("projects-excel");
      setIsExporting(true);

      const { data } = await refetch();

      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucune donnée disponible pour l'export",
        });
        return;
      }

      exportProjectsToExcel(data);
      toast({
        title: "Succès",
        description: "Fichier Excel des revues généré avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel des revues:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le fichier Excel",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  /**
   * Export PPTX des revues de projets
   */
  const handleProjectsPPTXExport = async () => {
    if (projectIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à exporter.",
      });
      return;
    }

    try {
      setExportType("projects-pptx");
      setIsExporting(true);

      const { data } = await refetch();

      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucune donnée disponible pour l'export",
        });
        return;
      }

      const adaptedData = adaptDataForPPTX(data);
      await generateProjectPPTX(adaptedData);

      toast({
        title: "Succès",
        description: "Présentation PowerPoint des revues générée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export PPTX des revues:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer la présentation PowerPoint",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // ===== Actions Présentation et Gantt =====

  /**
   * Navigue vers la page de présentation du portefeuille
   */
  const handlePresent = () => {
    if (projectIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à présenter.",
      });
      return;
    }
    navigate(`/portfolios/${portfolioData.id}/presentation`);
  };

  /**
   * Ouvre la vue Gantt des projets du portefeuille
   */
  const handleGantt = () => {
    if (projectIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet.",
      });
      return;
    }
    setIsGanttOpen(true);
  };

  /**
   * Retourne le message de chargement approprié
   */
  const getLoadingMessage = () => {
    switch (exportType) {
      case "portfolio-excel":
        return "Export Excel du portefeuille en cours...";
      case "portfolio-pptx":
        return "Export PowerPoint du portefeuille en cours...";
      case "projects-excel":
        return "Chargement des données pour l'export Excel des revues...";
      case "projects-pptx":
        return "Chargement des données pour l'export PowerPoint des revues...";
      default:
        return "Chargement...";
    }
  };

  const isDisabled = isExporting;
  const hasProjects = projectIds.length > 0;

  return (
    <>
      {/* Barre d'actions alignée - style cohérent avec ProjectSummaryActions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Exports Portefeuille */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePortfolioExcelExport}
          disabled={isDisabled}
          className="gap-2"
        >
          {exportType === "portfolio-excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Portefeuille Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handlePortfolioPPTXExport} disabled={isDisabled} className="gap-2">
          {exportType === "portfolio-pptx" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Presentation className="h-4 w-4" />
          )}
          Portefeuille PPTX
        </Button>

        {/* Séparateur subtil entre les deux groupes */}
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Actions Revues de projets */}
        <Button size="sm" onClick={handlePresent} disabled={isDisabled || !hasProjects} className="gap-2">
          <Play className="h-4 w-4" />
          Présenter la revue
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGantt}
          disabled={isDisabled || !hasProjects}
          className="gap-2"
        >
          <GanttChartSquare className="h-4 w-4" />
          Gantt
        </Button>

        {/* Menu déroulant pour les exports des revues */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isDisabled || !hasProjects} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter Revues
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleProjectsExcelExport} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleProjectsPPTXExport} className="gap-2 cursor-pointer">
              <Presentation className="h-4 w-4" />
              PowerPoint (.pptx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overlay de chargement pendant l'export */}
      {isExporting && <LoadingOverlay message={getLoadingMessage()} />}

      {/* Sheet Gantt */}
      <PortfolioGanttSheet isOpen={isGanttOpen} onClose={() => setIsGanttOpen(false)} projectIds={projectIds} />
    </>
  );
};
