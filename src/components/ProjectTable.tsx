import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning, Pencil, History, ListTodo, ShieldAlert, Star } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEditProject } from "@/utils/permissions";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  project_manager?: string;
  owner_id?: string;
  suivi_dgs?: boolean;
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

export const ProjectTable = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
}: ProjectTableProps) => {
  const navigate = useNavigate();
  const user = useUser();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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
            <TableHead>Suivi DGS</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status].icon;
            return (
              <TableRow
                key={project.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell className="font-medium">
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
                      project.progress === "better" ? "text-success" : project.progress === "stable" ? "text-neutral" : "text-danger"
                    )}
                  >
                    {project.progress === "better" ? "En amélioration" : project.progress === "stable" ? "Stable" : "En dégradation"}
                  </span>
                </TableCell>
                <TableCell>{project.completion}%</TableCell>
                <TableCell>{project.lastReviewDate}</TableCell>
                <TableCell>
                  {project.suivi_dgs && (
                    <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {canEditProject(userProfile?.role, user?.id, project.owner_id, project.project_manager, user?.email) && (
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
                  )}
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