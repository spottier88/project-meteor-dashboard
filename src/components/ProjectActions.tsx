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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
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
  onProjectDeleted?: () => void;
  owner_id?: string;
  project_manager?: string;
  permissions: {
    canEdit: boolean;
    isAdmin: boolean;
    isProjectManager: boolean;
    canManageTeam: boolean;
  };
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  onProjectDeleted,
  permissions,
}: ProjectActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <>
      {permissions.canEdit && (
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

      {(permissions.canEdit || permissions.canManageTeam || permissions.isAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {permissions.canEdit && (
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
            {permissions.canManageTeam && (
              <>
                {permissions.canEdit && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/team`)}>
                  <Users className="mr-2 h-4 w-4" />
                  Gérer l'équipe
                </DropdownMenuItem>
              </>
            )}
            {permissions.isAdmin && (
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