import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning, Pencil, History, ListTodo, ShieldAlert } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status].icon;
            return (
              <TableRow
                key={project.id}
                className="hover:bg-muted/50"
              >
                <TableCell 
                  className="font-medium cursor-pointer"
                  onClick={() => onProjectReview(project.id, project.title)}
                >
                  {project.title}
                </TableCell>
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
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectEdit(project.id);
                    }}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(project.id, project.title);
                    }}
                    className="h-8 w-8"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks/${project.id}`);
                    }}
                    className="h-8 w-8"
                  >
                    <ListTodo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/risks/${project.id}`);
                    }}
                    className="h-8 w-8"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};