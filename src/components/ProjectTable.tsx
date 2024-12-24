import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  project_manager?: string;
}

interface ProjectTableProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
}

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
};

export const ProjectTable = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
}: ProjectTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom du projet</TableHead>
            <TableHead>Chef de projet</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Avancement</TableHead>
            <TableHead>Dernière revue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status].icon;
            return (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onProjectReview(project.id, project.title)}
              >
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>{project.project_manager || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={cn("w-4 h-4", statusIcons[project.status].color)}
                      aria-label={statusIcons[project.status].label}
                    />
                    <span>{statusIcons[project.status].label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      progressColors[project.progress]
                    )}
                  >
                    {progressLabels[project.progress]}
                  </span>
                </TableCell>
                <TableCell>{project.completion}%</TableCell>
                <TableCell>{project.lastReviewDate}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};