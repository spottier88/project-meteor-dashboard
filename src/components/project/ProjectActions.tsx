import { Button } from "@/components/ui/button";
import { MoreHorizontal, History, Pencil, Trash2, FileEdit, Users, AlertCircle, ClipboardList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { useState } from "react";
import { AddToCartButton } from "../cart/AddToCartButton";
import { useCompletePermissions } from "@/hooks/use-complete-permissions";
import { useNavigate } from "react-router-dom";

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
  onReview?: (id: string, title: string) => void;
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  onProjectDeleted,
  onReview,
}: ProjectActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const permissions = useCompletePermissions(projectId);
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      {permissions.canViewProject && (
        <AddToCartButton projectId={projectId} projectTitle={projectTitle} />
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Plus d'actions"
          >
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {permissions.canEditProject && (
            <DropdownMenuItem onClick={() => onEdit(projectId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          )}
          {permissions.canCreateReview && onReview && (
            <DropdownMenuItem onClick={() => onReview(projectId, projectTitle)}>
              <FileEdit className="mr-2 h-4 w-4" />
              Nouvelle revue
            </DropdownMenuItem>
          )}
          {permissions.canViewReviews && (
            <DropdownMenuItem
              onClick={() => onViewHistory(projectId, projectTitle)}
            >
              <History className="mr-2 h-4 w-4" />
              Historique des revues
            </DropdownMenuItem>
          )}
          {/* Nouveaux boutons pour les tâches, risques et membres */}
          {(permissions.canCreateTask || permissions.canViewProject) && (
            <DropdownMenuItem onClick={() => navigate(`/tasks/${projectId}`)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Tâches
            </DropdownMenuItem>
          )}
          {(permissions.canCreateRisk || permissions.canViewProject) && (
            <DropdownMenuItem onClick={() => navigate(`/risks/${projectId}`)}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Risques
            </DropdownMenuItem>
          )}
          {(permissions.canManageMembers || permissions.canViewMembers) && (
            <DropdownMenuItem onClick={() => navigate(`/team/${projectId}`)}>
              <Users className="mr-2 h-4 w-4" />
              Équipe
            </DropdownMenuItem>
          )}
          {permissions.canDeleteProject && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectId={projectId}
        projectTitle={projectTitle}
        onProjectDeleted={onProjectDeleted}
      />
    </div>
  );
};