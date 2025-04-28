
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
import { useDetailedProjectsData } from "@/hooks/use-detailed-projects-data";

interface ProjectCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCart = ({ isOpen, onClose }: ProjectCartProps) => {
  const { cartItems, removeFromCart, clearCart } = useProjectCart();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const { data: detailedProjectsData, isLoading: isLoadingDetails } = useDetailedProjectsData(
    cartItems,
    isExporting
  );

  const handleExcelExport = async () => {
    try {
      setIsExporting(true);

      if (!detailedProjectsData) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucune donnée disponible pour l'export",
        });
        return;
      }

      exportProjectsToExcel(detailedProjectsData);
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
    }
  };

  const handlePPTXExport = async () => {
    if (!detailedProjectsData) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune donnée disponible pour l'export",
      });
      return;
    }

    try {
      await generateProjectPPTX(detailedProjectsData);
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
    }
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
                    <Button onClick={handlePPTXExport} variant="outline">
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
            {(isExporting && isLoadingDetails) && (
              <LoadingOverlay message="Chargement des données pour l'export..." />
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
