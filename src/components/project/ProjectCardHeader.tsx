import { CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { MonitoringBadge } from "../monitoring/MonitoringBadge";
import { ProjectActions } from "./ProjectActions";

interface ProjectCardHeaderProps {
  title: string;
  status: ProjectStatus | null;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  id: string;
  owner_id?: string;
  project_manager?: string;
  additionalActions?: React.ReactNode;
}

export const ProjectCardHeader = ({
  title,
  status,
  onEdit,
  onViewHistory,
  id,
  owner_id,
  project_manager,
  additionalActions,
}: ProjectCardHeaderProps) => {
  const user = useUser();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking project membership:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        <MonitoringBadge projectId={id} />
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        {additionalActions}
        <ProjectActions
          projectId={id}
          projectTitle={title}
          onEdit={onEdit}
          onViewHistory={onViewHistory}
          owner_id={owner_id}
          project_manager={project_manager}
          isMember={isMember}
        />
        {status && <StatusIcon status={status} />}
      </div>
    </CardHeader>
  );
};