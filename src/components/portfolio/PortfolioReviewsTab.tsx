/**
 * @file PortfolioReviewsTab.tsx
 * @description Onglet dédié aux revues de projets du portefeuille.
 * Contient les boutons d'action (présentation, Gantt, exports),
 * l'organisation des revues et l'envoi de notifications.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  GanttChartSquare,
  FileSpreadsheet,
  Presentation,
  Download,
  ChevronDown,
  Loader2,
  ClipboardList,
  CalendarPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDetailedProjectsData, ProjectData } from "@/hooks/use-detailed-projects-data";
import { usePortfolioReviews, PortfolioReview } from "@/hooks/usePortfolioReviews";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";
import { exportProjectsToExcel } from "@/utils/projectExport";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { PortfolioGanttSheet } from "./PortfolioGanttSheet";
import { PortfolioReviewForm } from "./PortfolioReviewForm";
import { PortfolioReviewList } from "./PortfolioReviewList";
import { ProjectData as PPTXProjectData } from "@/components/pptx/types";
import { ProjectStatus, ProgressStatus } from "@/types/project";

interface PortfolioReviewsTabProps {
  /** ID du portefeuille */
  portfolioId: string;
  /** Nom du portefeuille (pour navigation) */
  portfolioName: string;
  /** Liste des projets du portefeuille */
  projects: { id: string; title: string; project_manager_id?: string | null }[];
}

/**
 * Onglet des revues de projets avec boutons d'action et organisation des revues
 */
export const PortfolioReviewsTab = ({ portfolioId, portfolioName, projects }: PortfolioReviewsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PortfolioReview | null>(null);

  const projectIds = projects.map((p) => p.id);
  const hasProjects = projectIds.length > 0;

  // Hook pour les revues de portefeuille
  const {
    reviews,
    isLoading: isLoadingReviews,
    createReview,
    updateReview,
    deleteReview,
    isCreating,
    isUpdating,
  } = usePortfolioReviews(portfolioId);

  // Hook pour charger les données détaillées des projets (à la demande)
  const { refetch } = useDetailedProjectsData(projectIds, false);

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

  /**
   * Export Excel des revues de projets
   */
  const handleExcelExport = async () => {
    if (!hasProjects) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à exporter.",
      });
      return;
    }

    try {
      setExportType("excel");
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
  const handlePPTXExport = async () => {
    if (!hasProjects) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à exporter.",
      });
      return;
    }

    try {
      setExportType("pptx");
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

  /**
   * Navigue vers la page de présentation du portefeuille
   */
  const handlePresent = () => {
    if (!hasProjects) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Le portefeuille ne contient aucun projet à présenter.",
      });
      return;
    }
    navigate(`/portfolios/${portfolioId}/presentation`);
  };

  /**
   * Ouvre la vue Gantt des projets du portefeuille
   */
  const handleGantt = () => {
    if (!hasProjects) {
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
   * Gestion de la création d'une revue
   */
  const handleCreateReview = (data: { subject: string; review_date: string; notes?: string }) => {
    createReview(
      {
        portfolio_id: portfolioId,
        subject: data.subject,
        review_date: data.review_date,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      }
    );
  };

  /**
   * Gestion de la modification d'une revue
   */
  const handleEditReview = (data: { subject: string; review_date: string; notes?: string }) => {
    if (!editingReview) return;
    
    updateReview(
      {
        id: editingReview.id,
        subject: data.subject,
        review_date: data.review_date,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          setEditingReview(null);
        },
      }
    );
  };

  /**
   * Gestion du changement de statut
   */
  const handleStatusChange = (reviewId: string, status: PortfolioReview["status"]) => {
    updateReview({ id: reviewId, status });
  };

  /**
   * Retourne le message de chargement approprié
   */
  const getLoadingMessage = () => {
    switch (exportType) {
      case "excel":
        return "Chargement des données pour l'export Excel...";
      case "pptx":
        return "Chargement des données pour l'export PowerPoint...";
      default:
        return "Chargement...";
    }
  };

  const isDisabled = isExporting;

  return (
    <>
      <div className="space-y-6">
        {/* Barre d'actions en haut de l'onglet */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton d'organisation de revue */}
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            disabled={isDisabled}
            className="gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            Organiser une revue
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button size="sm" variant="outline" onClick={handlePresent} disabled={isDisabled || !hasProjects} className="gap-2">
            <Play className="h-4 w-4" />
            Présenter
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGantt}
            disabled={isDisabled || !hasProjects}
            className="gap-2"
          >
            <GanttChartSquare className="h-4 w-4" />
            Vue Gantt
          </Button>

          {/* Menu déroulant pour les exports */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDisabled || !hasProjects} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuItem onClick={handleExcelExport} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePPTXExport} className="gap-2 cursor-pointer">
                <Presentation className="h-4 w-4" />
                PowerPoint (.pptx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Liste des revues organisées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Revues organisées
            </CardTitle>
            <CardDescription>
              {reviews.length} revue{reviews.length !== 1 ? "s" : ""} organisée{reviews.length !== 1 ? "s" : ""} pour ce portefeuille
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PortfolioReviewList
                reviews={reviews}
                portfolioId={portfolioId}
                portfolioName={portfolioName}
                projects={projects}
                onEdit={(review) => setEditingReview(review)}
                onDelete={deleteReview}
                onStatusChange={handleStatusChange}
                isLoading={isUpdating}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overlay de chargement pendant l'export */}
      {isExporting && <LoadingOverlay message={getLoadingMessage()} />}

      {/* Sheet Gantt */}
      <PortfolioGanttSheet isOpen={isGanttOpen} onClose={() => setIsGanttOpen(false)} projectIds={projectIds} />

      {/* Formulaire de création de revue */}
      <PortfolioReviewForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateReview}
        isSubmitting={isCreating}
      />

      {/* Formulaire d'édition de revue */}
      <PortfolioReviewForm
        open={!!editingReview}
        onClose={() => setEditingReview(null)}
        onSubmit={handleEditReview}
        isSubmitting={isUpdating}
        initialData={
          editingReview
            ? {
                subject: editingReview.subject,
                review_date: editingReview.review_date,
                notes: editingReview.notes,
              }
            : undefined
        }
      />
    </>
  );
};
