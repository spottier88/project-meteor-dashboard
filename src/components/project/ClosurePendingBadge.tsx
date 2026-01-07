/**
 * Badge indiquant qu'un projet terminé a une évaluation en attente
 */

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ClosurePendingBadgeProps {
  className?: string;
}

export const ClosurePendingBadge = ({ className }: ClosurePendingBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={`border-orange-500 text-orange-600 bg-orange-50 ${className || ''}`}
    >
      <Clock className="h-3 w-3 mr-1" />
      Évaluation en attente
    </Badge>
  );
};
