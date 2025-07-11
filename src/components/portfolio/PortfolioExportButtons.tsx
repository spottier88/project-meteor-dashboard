
/**
 * @component PortfolioExportButtons
 * @description Boutons d'export pour les portefeuilles avec indicateurs de progression.
 * Permet d'exporter les données d'un portefeuille au format Excel ou PowerPoint
 * avec des indicateurs visuels du statut d'export.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generatePortfolioExcel } from "@/utils/portfolioExport";
import { generatePortfolioPPTX } from "@/components/pptx/portfolioSlideGenerators";

interface PortfolioExportButtonsProps {
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

export const PortfolioExportButtons = ({ portfolioData }: PortfolioExportButtonsProps) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPPTX, setIsExportingPPTX] = useState(false);
  const { toast } = useToast();

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      await generatePortfolioExcel(portfolioData);
      
      toast({
        title: "Export Excel réussi",
        description: `Le portefeuille "${portfolioData.name}" a été exporté au format Excel`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export Excel",
        variant: "destructive",
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePPTXExport = async () => {
    setIsExportingPPTX(true);
    try {
      await generatePortfolioPPTX(portfolioData);
      
      toast({
        title: "Export PowerPoint réussi",
        description: `Le portefeuille "${portfolioData.name}" a été exporté au format PowerPoint`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export PPTX:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export PowerPoint",
        variant: "destructive",
      });
    } finally {
      setIsExportingPPTX(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExcelExport}
        disabled={isExportingExcel}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {isExportingExcel ? "Export en cours..." : "Export Excel"}
      </Button>

      <Button
        onClick={handlePPTXExport}
        disabled={isExportingPPTX}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isExportingPPTX ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {isExportingPPTX ? "Export en cours..." : "Export PowerPoint"}
      </Button>
    </div>
  );
};
