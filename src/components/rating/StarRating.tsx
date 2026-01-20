/**
 * @component StarRating
 * @description Composant réutilisable pour afficher et sélectionner une note en étoiles
 * Supporte un mode interactif (cliquable) et un mode lecture seule
 */

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Valeur actuelle (1-5) */
  value: number;
  /** Callback appelé lors du changement de valeur (mode interactif) */
  onChange?: (value: number) => void;
  /** Mode lecture seule (pas de clic possible) */
  readonly?: boolean;
  /** Taille des étoiles */
  size?: "sm" | "md" | "lg";
  /** Classes CSS additionnelles */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = "md",
  className,
}: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (starValue: number) => {
    if (!readonly && onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue: number) => {
    if (!readonly) {
      setHoverValue(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  // Valeur à afficher : hover si actif, sinon valeur réelle
  const displayValue = hoverValue || value;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        !readonly && "cursor-pointer",
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = starValue <= displayValue;

        return (
          <Star
            key={starValue}
            className={cn(
              sizeClasses[size],
              "transition-all duration-150",
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
              !readonly && "hover:scale-110"
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
          />
        );
      })}
    </div>
  );
};
