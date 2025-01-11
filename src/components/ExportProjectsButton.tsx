import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { MultiProjectPDF } from "./MultiProjectPDF";
import type { MultiProjectPDFProps } from "./MultiProjectPDF";

export const ExportProjectsButton = ({ projectsData }: MultiProjectPDFProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <PDFDownloadLink
      document={<MultiProjectPDF projectsData={projectsData} />}
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