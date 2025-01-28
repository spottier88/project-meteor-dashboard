import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, History } from "lucide-react";
import { ProjectStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { MonitoringBadge } from "../monitoring/MonitoringBadge";
import { useEffect, useState } from "react";
import { canEditProject } from "@/utils/permissions";

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
  const [canManage, setCanManage] = useState(false);

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
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user?.id || !userRoles) return;
      
      const roles = userRoles.map(ur => ur.role);
      const hasEditPermission = await canEditProject(
        roles,
        user.id,
        id,
        project_manager,
        userProfile?.email
      );
      
      setCanManage(hasEditPermission);
    };

    checkPermissions();
  }, [user?.id, userRoles, id, project_manager, userProfile?.email]);

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        <MonitoringBadge projectId={id} />
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        {additionalActions}
        {canManage && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="h-8 w-8"
              title="Modifier le projet"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(id, title);
              }}
              className="h-8 w-8"
              title="Historique des revues de projet"
            >
              <History className="h-4 w-4" />
            </Button>
          </>
        )}
        {status && <StatusIcon status={status} />}
      </div>
    </CardHeader>
  );
};