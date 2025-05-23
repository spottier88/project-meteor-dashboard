
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  History, 
  ListTodo, 
  ShieldAlert, 
  Trash2, 
  Users, 
  MoreVertical,
  FileText 
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteProjectDialog } from "@/components/project/DeleteProjectDialog";
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
  canEdit?: boolean;
  isMember?: boolean;
  canManageTeam?: boolean;
  isAdmin?: boolean;
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  onProjectDeleted,
  canEdit,
  isMember,
  canManageTeam,
  isAdmin,
}: ProjectActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Nouvelle fonction pour la navigation vers l'historique avec état
  const navigateToHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reviews/${projectId}`, { 
      state: { 
        refresh: true, 
        timestamp: Date.now() 
      }
    });
  };

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
      <Button
        variant="ghost"
        size="icon"
        onClick={navigateToHistory}
        className="h-8 w-8"
        title="Historique des revues projets"
      >
        <History className="h-4 w-4" />
      </Button>

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
                <DropdownMenuItem onClick={() => navigate(`/framing/${projectId}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Cadrage du projet
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
