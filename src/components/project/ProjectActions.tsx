import { Button } from "@/components/ui/button";
import { MoreHorizontal, History, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { useState } from "react";
import { AddToCartButton } from "../cart/AddToCartButton";
import { canEditProject } from "@/utils/permissions";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  userRoles?: string[];
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
  userRoles = [],
  onProjectDeleted,
  owner_id,
  project_manager,
  isMember,
}: ProjectActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const user = useUser();

  const { data: canEdit } = useQuery({
    queryKey: ["projectPermissions", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Vérifier si l'utilisateur est admin
      const isAdmin = userRoles?.includes("admin");
      if (isAdmin) return true;

      // Vérifier si l'utilisateur est le propriétaire ou le chef de projet
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (owner_id === user.id || project_manager === userProfile?.email) {
        return true;
      }

      // Vérifier si l'utilisateur est un manager avec accès
      const isManager = userRoles?.includes("manager");
      if (isManager) {
        const { data: canAccess } = await supabase
          .rpc('can_manager_access_project', {
            p_user_id: user.id,
            p_project_id: projectId
          });
        return canAccess;
      }

      return false;
    },
    enabled: !!user?.id && !!projectId,
  });

  return (
    <div className="flex items-center gap-2">
      <AddToCartButton projectId={projectId} projectTitle={projectTitle} />
      
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
          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit(projectId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onViewHistory(projectId, projectTitle)}
          >
            <History className="mr-2 h-4 w-4" />
            Historique des revues
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
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