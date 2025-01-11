import { Button } from "@/components/ui/button";
import { Plus, History } from "lucide-react";
import { ExportProjectsButton } from "./ExportProjectsButton";
import type { MultiProjectPDFProps } from "./MultiProjectPDF";

interface DashboardHeaderProps {
  onNewProject: () => void;
  onNewReview: () => void;
  projectsData: MultiProjectPDFProps["projectsData"];
}

export const DashboardHeader = ({ 
  onNewProject, 
  onNewReview,
  projectsData 
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <div className="flex flex-wrap items-center gap-2">
        <ExportProjectsButton projectsData={projectsData} />
        <Button onClick={onNewReview} variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Nouvelle revue
        </Button>
        <Button onClick={onNewProject} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>
    </div>
  );
};