/**
 * @file PortfolioExportButtons.tsx
 * @description Boutons d'export du portefeuille (synthèse uniquement).
 * Affiché dans l'en-tête de la page du portefeuille.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Presentation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePortfolioExcel } from "@/utils/portfolioExport";
import { generatePortfolioPPTX } from "@/components/pptx/portfolioSlideGenerators";

interface PortfolioExportButtonsProps {
  /** Données du portefeuille pour l'export */
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
}

/**
 * Boutons d'export du portefeuille (Excel et PowerPoint)
 * pour la synthèse du portefeuille uniquement
 */
export const PortfolioExportButtons = ({ portfolioData }: PortfolioExportButtonsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "pptx" | null>(null);

  /**
   * Export Excel du portefeuille (synthèse)
   */
  const handleExcelExport = async () => {
    try {
      setExportType("excel");
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
  const handlePPTXExport = async () => {
    try {
      setExportType("pptx");
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

  const isDisabled = isExporting;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExcelExport}
        disabled={isDisabled}
        className="gap-2"
      >
        {exportType === "excel" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePPTXExport}
        disabled={isDisabled}
        className="gap-2"
      >
        {exportType === "pptx" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Presentation className="h-4 w-4" />
        )}
        PowerPoint
      </Button>
    </div>
  );
};
