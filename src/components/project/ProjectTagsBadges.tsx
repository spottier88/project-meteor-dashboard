/**
 * Composant d'affichage en lecture seule des tags d'un projet.
 * Badges colorés de manière déterministe selon le contenu du tag.
 */

import { Badge } from "@/components/ui/badge";
import { useProjectTags, getTagColor, getTagBgColor } from "@/hooks/useProjectTags";

interface ProjectTagsBadgesProps {
  projectId: string;
}

export const ProjectTagsBadges = ({ projectId }: ProjectTagsBadgesProps) => {
  const { data: tags = [] } = useProjectTags(projectId);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="px-2 py-0.5 text-xs"
          style={{
            backgroundColor: getTagBgColor(tag),
            color: getTagColor(tag),
            borderColor: getTagColor(tag),
            borderWidth: "1px",
          }}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
};
