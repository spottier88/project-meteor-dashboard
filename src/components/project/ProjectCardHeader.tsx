import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, History, Star } from "lucide-react";
import { ProjectStatus } from "../ProjectCard";
import { StatusIcon } from "./StatusIcon";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEditProject } from "@/utils/permissions";
import { UserRoleData } from "@/types/user";

interface ProjectCardHeaderProps {
  title: string;
  status: ProjectStatus | null;
  suivi_dgs?: boolean;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  id: string;
  owner_id?: string;
  project_manager?: string;
}

export const ProjectCardHeader = ({
  title,
  status,
  suivi_dgs,
  onEdit,
  onViewHistory,
  id,
  owner_id,
  project_manager,
}: ProjectCardHeaderProps) => {
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
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        {suivi_dgs && (
          <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
        )}
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        {canEditProject(roles, user?.id, owner_id, project_manager, user?.email) && (
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
        )}
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
        {status && <StatusIcon status={status} />}
      </div>
    </CardHeader>
  );
};
