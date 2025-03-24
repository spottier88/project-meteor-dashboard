
/**
 * @component LifecycleStatusBadge
 * @description Badge visuel affichant le statut du cycle de vie d'un projet.
 * Les statuts peuvent être: étude, validé, en cours, terminé, suspendu ou abandonné.
 * Chaque statut a sa propre couleur pour une identification visuelle rapide.
 */

import { Badge } from "@/components/ui/badge";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { cn } from "@/lib/utils";

interface LifecycleStatusBadgeProps {
  status: ProjectLifecycleStatus;
}

export const LifecycleStatusBadge = ({ status }: LifecycleStatusBadgeProps) => {
  const getStatusColor = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case "study":
        return "bg-gray-500 hover:bg-gray-600";
      case "validated":
        return "bg-blue-500 hover:bg-blue-600";
      case "in_progress":
        return "bg-green-500 hover:bg-green-600";
      case "completed":
        return "bg-purple-500 hover:bg-purple-600";
      case "suspended":
        return "bg-orange-500 hover:bg-orange-600";
      case "abandoned":
        return "bg-red-500 hover:bg-red-600";
    }
  };

  return (
    <Badge className={cn(getStatusColor(status), "text-white font-medium")}>
      {lifecycleStatusLabels[status]}
    </Badge>
  );
};
