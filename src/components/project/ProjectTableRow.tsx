import { TableCell, TableRow } from "@/components/ui/table";
import { Star } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "../ProjectCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEditProject } from "@/utils/permissions";
import { UserRoleData } from "@/types/user";
import { ProjectActions } from "./ProjectActions";
import { StatusIcon } from "./StatusIcon";
import { OrganizationCell } from "./OrganizationCell";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

interface ProjectTableRowProps {
  project: {
    id: string;
    title: string;
    status: ProjectStatus | null;
    progress: ProgressStatus | null;
    completion: number;
    lastReviewDate: string | null;
    project_manager?: string;
    owner_id?: string;
    suivi_dgs?: boolean;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
  };
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

const statusLabels = {
  sunny: "Ensoleillé",
  cloudy: "Nuageux",
  stormy: "Orageux",
} as const;

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

export const ProjectTableRow = ({
  project,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
}: ProjectTableRowProps) => {
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
        <OrganizationCell
          poleId={project.pole_id}
          directionId={project.direction_id}
          serviceId={project.service_id}
        />
      </TableCell>
      <TableCell>
        {project.status ? (
          <div className="flex items-center gap-2">
            <StatusIcon status={project.status} />
            <span>{statusLabels[project.status]}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Pas de revue</span>
        )}
      </TableCell>
      <TableCell>
        {project.progress ? (
          <span
            className={cn(
              "text-sm font-medium",
              project.progress === "better" ? "text-success" : project.progress === "stable" ? "text-neutral" : "text-danger"
            )}
          >
            {progressLabels[project.progress]}
          </span>
        ) : (
          <span className="text-muted-foreground">Pas de revue</span>
        )}
      </TableCell>
      <TableCell>{project.completion}%</TableCell>
      <TableCell>
        {project.lastReviewDate ? (
          new Date(project.lastReviewDate).toLocaleDateString("fr-FR")
        ) : (
          <span className="text-muted-foreground">Pas de revue</span>
        )}
      </TableCell>
      <TableCell>
        {project.suivi_dgs && (
          <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
        )}
      </TableCell>
      <TableCell className="text-right space-x-2">
        <AddToCartButton projectId={project.id} projectTitle={project.title} />
        <ProjectActions
          projectId={project.id}
          projectTitle={project.title}
          onEdit={onProjectEdit}
          onViewHistory={onViewHistory}
          canEdit={canEdit}
          userRoles={roles}
          onProjectDeleted={onProjectDeleted}
          owner_id={project.owner_id}
          project_manager={project.project_manager}
        />
      </TableCell>
    </TableRow>
  );
};
