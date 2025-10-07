
/**
 * @component ProjectActions
 * @description Boutons d'actions pour un projet.
 * Affiche les différentes actions possibles sur un projet (édition, revue,
 * gestion des tâches, des risques, du cadrage, de l'équipe, suppression).
 * Les actions disponibles dépendent des permissions de l'utilisateur connecté.
 */

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
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
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
  isMember?: boolean;
  canEdit?: boolean;
  canManageTeam?: boolean;
  isAdmin?: boolean;
  isSecondaryProjectManager?: boolean;
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  onProjectDeleted,
  owner_id,
  project_manager,
  isMember,
  canEdit,
  canManageTeam,
  isAdmin,
  isSecondaryProjectManager,
}: ProjectActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Utilisons les permissions passées en props plutôt que de les récupérer à nouveau
  // Si elles ne sont pas fournies, utilisons useProjectPermissions comme fallback
  const permissions = useProjectPermissions(projectId);
  
  // Priorité aux props reçues, sinon utiliser les permissions obtenues du hook
  const _canEdit = canEdit ?? permissions.canEdit;
  const _isMember = isMember ?? permissions.isMember;
  const _canManageTeam = canManageTeam ?? permissions.canManageTeam;
  const _isAdmin = isAdmin ?? permissions.isAdmin;
  const _isSecondaryProjectManager = isSecondaryProjectManager ?? permissions.isSecondaryProjectManager;

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
      {_canEdit && !_isSecondaryProjectManager && (
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

      {(_canEdit || _isMember || _canManageTeam || _isAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(_canEdit || _isMember) && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${projectId}`); }}>
                  <ListTodo className="mr-2 h-4 w-4" />
                  Gérer les tâches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/risks/${projectId}`); }}>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Gérer les risques
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/framing/${projectId}`); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Cadrage du projet
                </DropdownMenuItem>
              </>
            )}
            {_canManageTeam && (
              <>
                {(_canEdit || _isMember) && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/team`); }}>
                  <Users className="mr-2 h-4 w-4" />
                  Gérer l'équipe
                </DropdownMenuItem>
              </>
            )}
            {_isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
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
