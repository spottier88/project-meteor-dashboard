import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Presentation, GanttChartSquare, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateProjectPPTX } from "../pptx/ProjectPPTX";
import { useState } from "react";
import { ProjectGanttSheet } from "./ProjectGanttSheet";
import { exportProjectsToExcel } from "@/utils/projectExport";
import { LoadingOverlay } from "../ui/loading-overlay";
import { useDetailedProjectsData, ProjectData } from "@/hooks/use-detailed-projects-data";
import { ProjectData as PPTXProjectData } from "../pptx/types";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { RiskProbability, RiskSeverity, RiskStatus } from "@/types/risk";

interface ProjectCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCart = ({ isOpen, onClose }: ProjectCartProps) => {
  const { cartItems, removeFromCart, clearCart } = useProjectCart();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pptx' | null>(null);

  const { data: basicProjects } = useQuery({
    queryKey: ["basicProjects", cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", cartItems);
      return data || [];
    },
    enabled: cartItems.length > 0,
  });

  const { data: detailedProjectsData, isLoading: isLoadingDetails, refetch } = useDetailedProjectsData(
    cartItems,
    false // Nous ne l'activons pas automatiquement
  );

  // Fonction pour adapter les données au format attendu par le générateur PPTX
  const adaptDataForPPTX = (data: ProjectData[]): PPTXProjectData[] => {
    return data.map(item => {
      return {
        project: {
          ...item.project,
          status: item.project.status || "cloudy" as ProjectStatus,
          progress: item.project.progress || "stable" as ProgressStatus,
          lifecycle_status: item.project.lifecycle_status,
        },
        lastReview: item.lastReview ? {
          ...item.lastReview,
          weather: item.lastReview.weather || "cloudy" as ProjectStatus,
          progress: item.lastReview.progress || "stable" as ProgressStatus,
          actions: item.lastReview.actions || []
        } : undefined,
        risks: item.risks.map(risk => ({
          description: risk.description,
          probability: risk.probability,
          severity: risk.severity,
          status: risk.status,
          mitigation_plan: risk.mitigation_plan
        })),
        tasks: item.tasks.map(task => ({
          title: task.title,
          description: task.description,
          status: task.status as "todo" | "in_progress" | "done",
          assignee: task.assignee,
          due_date: task.due_date
        }))
      };
    });
  };

  const handleExcelExport = async () => {
    try {
      setExportType('excel');
      setIsExporting(true);

      // Déclencher le chargement des données
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
        description: "Fichier Excel généré avec succès",
      });
    } catch (error) {
      console.error("Error generating Excel file:", error);
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

  const handlePPTXExport = async () => {
    try {
      setExportType('pptx');
      setIsExporting(true);
      
      // Déclencher le chargement des données
      const { data } = await refetch();
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucune donnée disponible pour l'export",
        });
        return;
      }

      // Adapter les données pour le format PPTX
      const adaptedData = adaptDataForPPTX(data);
      
      await generateProjectPPTX(adaptedData);
      toast({
        title: "Succès",
        description: "Présentation PowerPoint générée avec succès",
      });
    } catch (error) {
      console.error("Error generating PPTX:", error);
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

  // Déterminer le message de chargement en fonction du type d'export
  const getLoadingMessage = () => {
    if (exportType === 'excel') return "Chargement des données pour l'export Excel...";
    if (exportType === 'pptx') return "Chargement des données pour l'export PowerPoint...";
    return "Chargement des données...";
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Projets sélectionnés ({cartItems.length})</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 relative">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun projet dans le panier</p>
            ) : (
              <>
                <div className="space-y-4">
                  {basicProjects?.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <span>{project.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(project.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => clearCart()}>
                    Vider le panier
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      onClick={handleExcelExport} 
                      variant="outline"
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button 
                      onClick={handlePPTXExport} 
                      variant="outline"
                      disabled={isExporting}
                    >
                      <Presentation className="h-4 w-4 mr-2" />
                      PPTX
                    </Button>
                    <Button onClick={() => setIsGanttOpen(true)} variant="outline">
                      <GanttChartSquare className="h-4 w-4 mr-2" />
                      Gantt
                    </Button>
                  </div>
                </div>
              </>
            )}
            {isExporting && isLoadingDetails && (
              <LoadingOverlay message={getLoadingMessage()} />
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ProjectGanttSheet
        isOpen={isGanttOpen}
        onClose={() => setIsGanttOpen(false)}
        projectIds={cartItems}
      />
    </>
  );
};
