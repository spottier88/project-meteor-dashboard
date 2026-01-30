/**
 * @component ProjectClosedBadge
 * @description Badge indiquant qu'un projet est clôturé (terminé)
 * Affiche un état visuel clair pour signaler le mode lecture seule
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectClosedBadgeProps {
  className?: string;
}

export const ProjectClosedBadge = ({ className }: ProjectClosedBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "border-green-500 text-green-700 bg-green-50 dark:border-green-400 dark:text-green-400 dark:bg-green-950",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Projet clôturé
    </Badge>
  );
};
