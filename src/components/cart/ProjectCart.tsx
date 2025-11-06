import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Presentation, GanttChartSquare, FileSpreadsheet, ArrowUpDown } from "lucide-react";
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
import { statusIcons } from "@/lib/project-status";

interface ProjectCartProps {
  isOpen: boolean;
  onClose: () => void;
}

type BasicProject = {
  id: string;
  title: string;
  weather: "sunny" | "cloudy" | "stormy" | null;
};

type SortOption = 'none' | 'weather-asc' | 'weather-desc' | 'name-asc' | 'name-desc';

/**
 * Fonction pour obtenir l'ordre de priorité de la météo
 * sunny (1) < cloudy (2) < stormy (3) < null (4)
 */
const getWeatherPriority = (weather: string | null): number => {
  switch (weather) {
    case 'sunny': return 1;
    case 'cloudy': return 2;
    case 'stormy': return 3;
    default: return 4; // null en dernier
  }
};

/**
 * Fonction de tri des projets selon l'option sélectionnée
 */
const sortProjects = <T extends { title: string; weather?: string | null; id?: string }>(
  projects: T[], 
  option: SortOption
): T[] => {
  if (option === 'none') return projects;
  
  const sorted = [...projects];
  
  switch (option) {
    case 'weather-asc':
      sorted.sort((a, b) => {
        const priorityA = getWeatherPriority(a.weather || null);
        const priorityB = getWeatherPriority(b.weather || null);
        return priorityA - priorityB;
      });
      break;
    case 'weather-desc':
      sorted.sort((a, b) => {
        const priorityA = getWeatherPriority(a.weather || null);
        const priorityB = getWeatherPriority(b.weather || null);
        return priorityB - priorityA;
      });
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title, 'fr'));
      break;
  }
  
  return sorted;
};

export const ProjectCart = ({ isOpen, onClose }: ProjectCartProps) => {
  const { cartItems, removeFromCart, clearCart } = useProjectCart();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pptx' | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('none');

  const { data: basicProjects } = useQuery({
    queryKey: ["basicProjects", cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      
      // Récupérer les projets
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", cartItems);
      
      if (!projects) return [];
      
      // Récupérer les météos depuis latest_reviews
      const { data: reviews } = await supabase
        .from("latest_reviews")
        .select("project_id, weather")
        .in("project_id", cartItems);
      
      // Créer un map des météos
      const weatherMap = new Map(reviews?.map(r => [r.project_id, r.weather]) || []);
      
      // Enrichir les projets avec leur météo
      return projects.map(p => ({
        ...p,
        weather: weatherMap.get(p.id) || null
      })) as BasicProject[];
    },
    enabled: cartItems.length > 0,
  });

  // Appliquer le tri aux projets de base
  const sortedBasicProjects = sortProjects(basicProjects || [], sortOption);

  // Fonction pour trier les données détaillées selon l'ordre défini
  const getSortedDetailedProjects = (data: ProjectData[]): ProjectData[] => {
    if (sortOption === 'none') return data;
    
    // Créer une version triée des projets basiques pour obtenir l'ordre
    const sortedBasic = sortProjects(
      data.map(d => ({
        id: d.project.id,
        title: d.project.title,
        weather: d.lastReview?.weather || null
      })),
      sortOption
    );
    
    // Réordonner les données détaillées selon cet ordre
    const dataMap = new Map(data.map(d => [d.project.id, d]));
    return sortedBasic.map(p => dataMap.get(p.id)!).filter(Boolean);
  };

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

      // Appliquer le tri avant l'export
      const sortedData = getSortedDetailedProjects(data);
      exportProjectsToExcel(sortedData);
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

      // Appliquer le tri avant l'export
      const sortedData = getSortedDetailedProjects(data);
      
      // Adapter les données pour le format PPTX
      const adaptedData = adaptDataForPPTX(sortedData);
      
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
            {cartItems.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Trier par..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sans tri (ordre d'ajout)</SelectItem>
                    <SelectItem value="weather-asc">☀️ Météo : Ensoleillé → Orageux</SelectItem>
                    <SelectItem value="weather-desc">⛈️ Météo : Orageux → Ensoleillé</SelectItem>
                    <SelectItem value="name-asc">🔤 Nom : A → Z</SelectItem>
                    <SelectItem value="name-desc">🔤 Nom : Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </SheetHeader>
          <div className="mt-6 space-y-4 relative">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun projet dans le panier</p>
            ) : (
              <>
                <div className="space-y-4">
                  {sortedBasicProjects?.map((project) => {
                    const WeatherIcon = project.weather ? statusIcons[project.weather].icon : null;
                    const weatherColor = project.weather ? statusIcons[project.weather].color : "";
                    
                    return (
                      <div key={project.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {WeatherIcon && (
                            <WeatherIcon className={`h-4 w-4 flex-shrink-0 ${weatherColor}`} />
                          )}
                          <span className="truncate">{project.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(project.id)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
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
        projectIds={sortedBasicProjects?.map(p => p.id) || cartItems}
      />
    </>
  );
};
