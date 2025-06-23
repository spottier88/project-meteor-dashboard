
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusIcon } from "./project/StatusIcon";
import { ProjectStatus } from "@/types/project";
import { useReviewableProjects } from "@/hooks/useReviewableProjects";

interface ProjectWithStatus {
  id: string;
  title: string;
  status?: ProjectStatus | null;
  weather?: ProjectStatus | null;
  last_review_date?: string | null;
  lastReviewDate?: string | null;
  project_manager?: string;
}

interface ProjectSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (id: string, title: string) => void;
}

export const ProjectSelectionSheet = ({
  isOpen,
  onClose,
  onProjectSelect,
}: ProjectSelectionSheetProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Utiliser le nouveau hook pour récupérer uniquement les projets reviewables
  const { data: reviewableProjects = [], isLoading } = useReviewableProjects();

  // Filtrage côté client uniquement pour la recherche textuelle
  const filteredProjects = reviewableProjects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getReviewDate = (project: ProjectWithStatus): string | null => {
    // Gérer les deux formats possibles de date de revue
    return project.last_review_date || project.lastReviewDate || null;
  };

  const getStatusForDisplay = (project: ProjectWithStatus): ProjectStatus | null => {
    // Utiliser weather en priorité ou status si weather n'est pas disponible
    return project.weather || project.status || null;
  };

  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sélectionner un projet</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sélectionner un projet</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Input
            placeholder="Rechercher par nom de projet ou chef de projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du projet</TableHead>
                  <TableHead>Chef de projet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière revue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onProjectSelect(project.id, project.title)}
                  >
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.project_manager || "-"}</TableCell>
                    <TableCell>
                      <StatusIcon status={getStatusForDisplay(project)} />
                    </TableCell>
                    <TableCell>{getReviewDate(project)}</TableCell>
                  </TableRow>
                ))}
                {filteredProjects.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      {reviewableProjects.length === 0 
                        ? "Aucun projet disponible pour les revues" 
                        : "Aucun projet trouvé"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
