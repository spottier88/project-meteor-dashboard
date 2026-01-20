/**
 * @component AppRatingButton
 * @description Bouton d'accès au formulaire d'évaluation de l'application
 * Affiche une icône étoile avec un badge indicateur si l'utilisateur n'a pas encore évalué
 */

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppRatingDialog } from "./AppRatingDialog";
import { useAppRating } from "@/hooks/useAppRating";

export const AppRatingButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasRated, isLoading } = useAppRating();

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            className="relative h-9 w-9"
            disabled={isLoading}
          >
            <Star className="h-4 w-4" />
            {/* Badge indicateur si pas encore évalué */}
            {!hasRated && !isLoading && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-500 rounded-full border-2 border-background" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasRated ? "Modifier mon évaluation" : "Évaluer l'application"}
        </TooltipContent>
      </Tooltip>

      <AppRatingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};
