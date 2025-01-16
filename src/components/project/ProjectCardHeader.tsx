import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, History, ListTodo } from "lucide-react";
import { ProjectStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEditProject, canViewProjectHistory, canManageTasks } from "@/utils/permissions";
import { UserRoleData } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { MonitoringBadge } from "../monitoring/MonitoringBadge";

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
  const navigate = useNavigate();

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

  const roles = userRoles?.map(ur => ur.role);
  const isManager = roles?.includes("manager");
  const isAdmin = roles?.includes("admin");
  const canEdit = canEditProject(roles, user?.id, owner_id, project_manager, userProfile?.email);
  const canViewHistory = canViewProjectHistory(roles, user?.id, owner_id, project_manager, userProfile?.email);
  const canManageProjectTasks = canManageTasks(roles, user?.id, owner_id, project_manager, userProfile?.email);

  // Un manager ne peut que consulter les projets auxquels il a accès
  // S'il est uniquement manager (et pas chef de projet du projet), il ne doit pas voir les boutons d'action

  // On masque le boutons de gestion des tâches.
  //          {canManageProjectTasks && (
  //            <Button
  //              variant="ghost"
  //              size="icon"
  //              onClick={(e) => {
  //                e.stopPropagation();
  //                navigate(`/tasks/${id}`);
  //              }}
  //              className="h-8 w-8"
  //              title="Gérer les tâches"
  //            >
  //              <ListTodo className="h-4 w-4" />
  //            </Button>
  //          )}
  
  
  const isOnlyManager = isManager && project_manager !== userProfile?.email && !isAdmin;
  const showActions = !isOnlyManager;

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        <MonitoringBadge projectId={id} />
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        {additionalActions}
        {showActions && (
          <>
            {canEdit && (
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
            {canViewHistory && (
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
            )}
            
          </>
        )}
        {status && <StatusIcon status={status} />}
      </div>
    </CardHeader>
  );
};
