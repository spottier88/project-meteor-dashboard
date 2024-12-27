import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sun, Cloud, CloudLightning, Star } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEditProject } from "@/utils/permissions";
import { UserRoleData } from "@/types/user";
import { ProjectActions } from "./project/ProjectActions";
import { StatusIcon } from "./project/StatusIcon";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
  project_manager?: string;
  owner_id?: string;
  suivi_dgs?: boolean;
}

interface ProjectTableProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
};

export const ProjectTable = ({
  projects,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
}: ProjectTableProps) => {
  const navigate = useNavigate();
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const roles = userRoles?.map(ur => ur.role);

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
            const canEdit = canEditProject(roles, user?.id, project.owner_id, project.project_manager, user?.email);

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
                  {project.status && (
                    <div className="flex items-center gap-2">
                      <StatusIcon status={project.status} />
                      <span>{statusIcons[project.status].label}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {project.progress && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        project.progress === "better" ? "text-success" : project.progress === "stable" ? "text-neutral" : "text-danger"
                      )}
                    >
                      {project.progress === "better" ? "En amélioration" : project.progress === "stable" ? "Stable" : "En dégradation"}
                    </span>
                  )}
                </TableCell>
                <TableCell>{project.completion}%</TableCell>
                <TableCell>{project.lastReviewDate || "Aucune revue"}</TableCell>
                <TableCell>
                  {project.suivi_dgs && (
                    <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <ProjectActions
                    projectId={project.id}
                    projectTitle={project.title}
                    onEdit={onProjectEdit}
                    onViewHistory={onViewHistory}
                    canEdit={canEdit}
                    userRoles={roles}
                    onProjectDeleted={onProjectDeleted}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
