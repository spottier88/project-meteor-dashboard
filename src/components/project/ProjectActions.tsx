import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  History, 
  ListTodo, 
  ShieldAlert, 
  Trash2, 
  Users, 
  MoreVertical 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { UserRole } from "@/types/user";
import { useUser } from "@supabase/auth-helpers-react";
import { canViewProjectHistory, canEditProject } from "@/utils/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          projectId,
          project_manager,
          user.email || undefined
        );
        setCanEdit(hasEditPermission);
      }
    };
    
    checkEditPermission();
  }, [userRoles, user, projectId, project_manager]);

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const canViewHistory = canViewProjectHistory(userRoles, user?.id, owner_id, project_manager, user?.email);
  const canManageTeam = isAdmin || (user?.email === project_manager);

  return (
    <>
      {/* Actions principales toujours visibles */}
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

      {/* Menu déroulant pour les actions secondaires */}
      {(canEdit || isMember || canManageTeam || isAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(canEdit || isMember) && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/tasks/${projectId}`)}>
                  <ListTodo className="mr-2 h-4 w-4" />
                  Gérer les tâches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/risks/${projectId}`)}>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Gérer les risques
                </DropdownMenuItem>
              </>
            )}
            {canManageTeam && (
              <>
                {(canEdit || isMember) && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/team`)}>
                  <Users className="mr-2 h-4 w-4" />
                  Gérer l'équipe
                </DropdownMenuItem>
              </>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le projet
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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