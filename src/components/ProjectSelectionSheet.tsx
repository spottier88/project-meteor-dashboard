import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusIcon } from "./project/StatusIcon";
import { ProjectStatus } from "./ProjectCard";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  lastReviewDate: string;
  project_manager?: string;
}

interface ProjectSelectionSheetProps {
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (id: string, title: string) => void;
}

export const ProjectSelectionSheet = ({
  projects,
  isOpen,
  onClose,
  onProjectSelect,
}: ProjectSelectionSheetProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

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
                      <StatusIcon status={project.status} />
                    </TableCell>
                    <TableCell>{project.lastReviewDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};