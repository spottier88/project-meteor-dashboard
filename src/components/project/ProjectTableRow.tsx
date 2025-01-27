import { TableCell, TableRow } from "@/components/ui/table";
import { ProjectActions } from "./ProjectActions";
import { OrganizationCell } from "./OrganizationCell";
import { StatusIcon } from "./StatusIcon";
import { LifecycleStatusBadge } from "./LifecycleStatusBadge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectLifecycleStatus } from "@/types/project";

interface Project {
  id: string;
  title: string;
  status: string | null;
  progress: string | null;
  completion: number;
  lastReviewDate: string | null;
  project_manager?: string;
  owner_id?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  suivi_dgs?: boolean;
  lifecycle_status: ProjectLifecycleStatus;
}

interface ProjectTableRowProps {
  project: Project;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

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
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", project.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking project membership:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
  });

  const { data: latestReview } = useQuery({
    queryKey: ["latestReview", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("latest_reviews")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching latest review:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!project.id,
  });

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <TableCell className="font-medium">{project.title}</TableCell>
      <TableCell>{project.project_manager}</TableCell>
      <TableCell>
        <OrganizationCell
          poleId={project.pole_id}
          directionId={project.direction_id}
          serviceId={project.service_id}
        />
      </TableCell>
      <TableCell>
        <StatusIcon status={latestReview?.weather || null} />
      </TableCell>
      <TableCell>
        <LifecycleStatusBadge status={project.lifecycle_status} />
      </TableCell>
      <TableCell>{latestReview?.completion || 0}%</TableCell>
      <TableCell>
        {latestReview?.created_at
          ? new Date(latestReview.created_at).toLocaleDateString()
          : "-"}
      </TableCell>
      <TableCell>{project.suivi_dgs ? "DGS" : "-"}</TableCell>
      <TableCell>
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <ProjectActions
            projectId={project.id}
            projectTitle={project.title}
            onEdit={onProjectEdit}
            onViewHistory={onViewHistory}
            userRoles={userRoles?.map(ur => ur.role)}
            onProjectDeleted={onProjectDeleted}
            owner_id={project.owner_id}
            project_manager={project.project_manager}
            isMember={isMember}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};