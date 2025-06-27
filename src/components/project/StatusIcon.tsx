
/**
 * @component StatusIcon
 * @description Affiche une icône représentant le statut météorologique d'un projet.
 * Les statuts peuvent être: ensoleillé (sunny), nuageux (cloudy), orageux (stormy),
 * ou en attente (hourglass si null). Chaque statut a sa propre couleur et icône.
 */

import { Sun, Cloud, CloudLightning, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/project";

const statusIcons = {
  sunny: { icon: Sun, color: "text-amber-400", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-blue-400", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-red-500", label: "Orageux" },
} as const;

interface StatusIconProps {
  status: ProjectStatus | null;
  className?: string;
}

export const StatusIcon = ({ status, className }: StatusIconProps) => {
  // Si le statut est null, undefined, ou une chaîne non reconnue, afficher l'icône par défaut
  if (!status || !statusIcons[status as keyof typeof statusIcons]) {
    return (
      <Hourglass
        className={cn("w-6 h-6 text-muted-foreground", className)}
        aria-label="En attente de revue"
      />
    );
  }
  
  const StatusIconComponent = statusIcons[status].icon;
  return (
    <StatusIconComponent
      className={cn("w-6 h-6", statusIcons[status].color, className)}
      aria-label={statusIcons[status].label}
    />
  );
};
