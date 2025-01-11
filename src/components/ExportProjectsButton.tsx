import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { MultiProjectPDF } from "./MultiProjectPDF";

interface ExportProjectsButtonProps {
  projects: any[]; // Adjust the type according to your project structure
}

export const ExportProjectsButton = ({ projects }: ExportProjectsButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <PDFDownloadLink
      document={<MultiProjectPDF projects={projects} />}
      fileName="projets-export.pdf"
    >
      {({ loading }) => (
        <Button 
          type="button" 
          disabled={loading || isGenerating}
          onClick={() => setIsGenerating(true)}
        >
          {loading || isGenerating ? "Génération..." : "Télécharger le PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};
