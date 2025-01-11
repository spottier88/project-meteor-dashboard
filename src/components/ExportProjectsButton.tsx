import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { MultiProjectPDF } from "./MultiProjectPDF";
import type { MultiProjectPDFProps } from "./MultiProjectPDF";
import { ProjectSelectionSheet } from "./ProjectSelectionSheet";

interface ExportProjectsButtonProps {
  projectsData: MultiProjectPDFProps["projectsData"];
}

export const ExportProjectsButton = ({ projectsData }: ExportProjectsButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<MultiProjectPDFProps["projectsData"]>([]);

  const handleProjectSelect = (selectedData: MultiProjectPDFProps["projectsData"]) => {
    setSelectedProjects(selectedData);
    setIsSelectionOpen(false);
  };

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setIsSelectionOpen(true)}
        variant="outline"
      >
        Sélectionner les projets à exporter
      </Button>

      {selectedProjects.length > 0 && (
        <PDFDownloadLink
          document={<MultiProjectPDF projectsData={selectedProjects} />}
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
      )}

      <ProjectSelectionSheet
        projects={projectsData}
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onProjectSelect={handleProjectSelect}
      />
    </>
  );
};