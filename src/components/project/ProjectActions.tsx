import { Button } from "@/components/ui/button";
import { Pencil, History, ListTodo, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { UserRole } from "@/types/user";

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  canEdit: boolean;
  userRoles?: UserRole[];
  onProjectDeleted: () => void;
}

export const ProjectActions = ({
  projectId,
  projectTitle,
  onEdit,
  onViewHistory,
  canEdit,
  userRoles,
  onProjectDeleted,
}: ProjectActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAdmin = userRoles?.includes("admin");

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => onEdit(projectId))}
          className="h-8 w-8"
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
      >
        <History className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => handleClick(e, () => navigate(`/tasks/${projectId}`))}
        className="h-8 w-8"
      >
        <ListTodo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => handleClick(e, () => navigate(`/risks/${projectId}`))}
        className="h-8 w-8"
      >
        <ShieldAlert className="h-4 w-4" />
      </Button>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleClick(e, () => setIsDeleteDialogOpen(true))}
          className="h-8 w-8"
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