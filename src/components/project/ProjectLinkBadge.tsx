/**
 * @file ProjectLinkBadge.tsx
 * @description Badge visuel indiquant qu'un projet est lié ou maître
 * Affiche "Projet lié" pour les projets liés à un maître
 * Affiche "Projet maître (X)" pour les projets ayant des projets liés
 */

import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon } from "lucide-react";
import { useProjectLinks } from "@/hooks/useProjectLinks";

interface ProjectLinkBadgeProps {
  projectId: string;
}

export const ProjectLinkBadge = ({ projectId }: ProjectLinkBadgeProps) => {
  const { linkedProjects, isLinkedProject } = useProjectLinks(projectId);

  if (isLinkedProject) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
        <LinkIcon className="h-3 w-3" />
        Projet lié
      </Badge>
    );
  }

  if (linkedProjects && linkedProjects.length > 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
        <LinkIcon className="h-3 w-3" />
        Projet maître ({linkedProjects.length})
      </Badge>
    );
  }

  return null;
};
