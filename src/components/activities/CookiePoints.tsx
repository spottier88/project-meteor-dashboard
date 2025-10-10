/**
 * @component CookiePoints
 * @description Affichage ludique des points sous forme de cookies
 * Ratio : 1 cookie = 1 point
 */
import { Cookie } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CookiePointsProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CookiePoints = ({ points, size = 'md', className = '' }: CookiePointsProps) => {
  const sizeConfig = {
    sm: { icon: 12, maxDisplay: 15 },
    md: { icon: 16, maxDisplay: 20 },
    lg: { icon: 20, maxDisplay: 25 }
  };

  const config = sizeConfig[size];
  const displayPoints = Math.min(points, config.maxDisplay);
  const hasMore = points > config.maxDisplay;

  // Créer un tableau de cookies à afficher
  const cookies = Array.from({ length: displayPoints }, (_, i) => i);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-0.5 flex-wrap ${className}`}>
            {cookies.map((_, index) => (
              <Cookie
                key={index}
                className="text-amber-600"
                size={config.icon}
                fill="currentColor"
              />
            ))}
            {hasMore && (
              <span className="ml-1 text-xs text-muted-foreground">
                +{points - config.maxDisplay}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{points} point{points > 1 ? 's' : ''} (🍪 = 1 pt)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
