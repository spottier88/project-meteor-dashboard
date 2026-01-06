/**
 * Badge indiquant que l'utilisateur visualise le projet en lecture seule
 * via son appartenance à un portefeuille
 */

import { Badge } from "@/components/ui/badge";
import { Eye, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PortfolioReadOnlyBadgeProps {
  portfolioName?: string;
}

export const PortfolioReadOnlyBadge = ({ portfolioName }: PortfolioReadOnlyBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1.5 bg-blue-100 text-blue-700 border-blue-200">
            <Eye className="h-3 w-3" />
            <span>Lecture seule</span>
            <Briefcase className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Accès en lecture seule via le portefeuille
            {portfolioName && <strong> "{portfolioName}"</strong>}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
