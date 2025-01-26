import { Button } from "@/components/ui/button";
import { Pencil, History, ListTodo, ShieldAlert, Trash2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { UserRole } from "@/types/user";
import { useUser } from "@supabase/auth-helpers-react";
import { canViewProjectHistory, canManageTasks, canManageRisks, canEditProject } from "@/utils/permissions";

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  userRoles?: UserRole[];
  onProjectDeleted: () => void;
  owner_id?: string;
  project_manager?: string;
  isMember?: boolean;
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  userRoles,
  onProjectDeleted,
  owner_id,
  project_manager,
  isMember,
}: ProjectActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAdmin = userRoles?.includes("admin");
  const user = useUser();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkEditPermission = async () => {
      if (user) {
        const hasEditPermission = await canEditProject(
          userRoles,
          user.id,
          owner_id,
          projectId,
          project_manager,
          user.email || undefined
        );
        setCanEdit(hasEditPermission);
      }
    };
    
    checkEditPermission();
  }, [userRoles, user, owner_id, projectId, project_manager]);

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const canViewHistory = canViewProjectHistory(userRoles, user?.id, owner_id, project_manager, user?.email);
  const canManageProjectTasks = canManageTasks(userRoles, user?.id, owner_id, project_manager, user?.email) || isMember;
  const canManageProjectRisks = canManageRisks(userRoles, user?.id, owner_id, project_manager, user?.email) || isMember;
  const canManageTeam = isAdmin || (user?.email === project_manager);

  return (
    <>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => onEdit(projectId))}
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
          onClick={(e) =>
            handleClick(e, () => onViewHistory(projectId, projectTitle))
          }
          className="h-8 w-8"
          title="Historique des revues projets"
        >
          <History className="h-4 w-4" />
        </Button>
      )}
      {canManageProjectTasks && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => navigate(`/tasks/${projectId}`))}
          className="h-8 w-8"
          title="Gérer les tâches"
        >
          <ListTodo className="h-4 w-4" />
        </Button>
      )}
      {canManageProjectRisks && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => navigate(`/risks/${projectId}`))}
          className="h-8 w-8"
          title="Gérer les risques"
        >
          <ShieldAlert className="h-4 w-4" />
        </Button>
      )}
      {canManageTeam && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => navigate(`/projects/${projectId}/team`))}
          className="h-8 w-8"
          title="Gérer l'équipe"
        >
          <Users className="h-4 w-4" />
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => setIsDeleteDialogOpen(true))}
          className="h-8 w-8"
          title="Supprimer le projet"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}

      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        projectId={projectId}
        projectTitle={projectTitle}
        onProjectDeleted={onProjectDeleted}
      />
    </>
  );
};