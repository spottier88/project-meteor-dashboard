
/**
 * @component FavoriteButton
 * @description Bouton pour ajouter/retirer un projet des favoris.
 * Affiche une étoile pleine si le projet est en favori, vide sinon.
 */

import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useFavoriteProjects } from "@/hooks/useFavoriteProjects";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  projectId: string;
  className?: string;
}

export const FavoriteButton = ({ projectId, className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, isToggling } = useFavoriteProjects();
  
  const favorite = isFavorite(projectId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleFavorite(projectId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={handleClick}
      disabled={isToggling}
      title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-colors",
          favorite
            ? "text-yellow-500 fill-yellow-500"
            : "text-muted-foreground hover:text-yellow-500"
        )}
      />
    </Button>
  );
};
