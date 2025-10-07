
/**
 * @component ProjectCardHeader
 * @description En-tête des cartes de projet affichées sur le tableau de bord.
 * Affiche le titre du projet, son statut et les actions possibles.
 * Gère l'affichage des boutons d'action en fonction des permissions de l'utilisateur.
 */

import { CardHeader } from "@/components/ui/card";
import { ProjectActions } from "./ProjectActions";
import { StatusIcon } from "./StatusIcon";
import { ProjectStatus } from "@/types/project";
import { cn } from "@/lib/utils";

interface ProjectCardHeaderProps {
  title: string;
  status: ProjectStatus | null;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  id: string;
  canEdit?: boolean;
  isMember?: boolean;
  canManageTeam?: boolean;
  isAdmin?: boolean;
  additionalActions?: React.ReactNode;
}

export const ProjectCardHeader = ({
  title,
  status,
  onEdit,
  onViewHistory,
  id,
  canEdit,
  isMember,
  canManageTeam,
  isAdmin,
  additionalActions,
}: ProjectCardHeaderProps) => {
  return (
    <CardHeader className={cn(
      "flex flex-row items-center justify-between space-y-0 pb-2 pt-4",
    )}>
      <div className="flex items-center space-x-2">
        <StatusIcon status={status} className="h-6 w-6 shrink-0" />
        <h2 className="text-xl font-semibold truncate max-w-[240px] md:max-w-xs">{title}</h2>
      </div>
      <div className="flex items-center space-x-2 shrink-0" data-no-navigate>
        {additionalActions}
        <ProjectActions
          projectId={id}
          projectTitle={title}
          onEdit={onEdit}
          onViewHistory={onViewHistory}
          canEdit={canEdit}
          isMember={isMember}
          canManageTeam={canManageTeam}
          isAdmin={isAdmin}
        />
      </div>
    </CardHeader>
  );
};
