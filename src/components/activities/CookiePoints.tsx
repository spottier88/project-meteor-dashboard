/**
 * @component CookiePoints
 * @description Affichage ludique des points sous forme de cookies avec animations
 * Ratio : 1 cookie = 1 point
 * Animations : apparition progressive, effet de hover, effet de "crunch"
 */
import { Cookie } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CookiePointsProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Activer l'animation d'apparition progressive */
  animated?: boolean;
}

export const CookiePoints = ({ points, size = 'md', className = '', animated = true }: CookiePointsProps) => {
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
                className={`
                  text-amber-600 
                  transition-all 
                  duration-300 
                  cursor-pointer
                  hover:scale-125 
                  hover:rotate-12
                  hover:text-amber-500
                  active:scale-95
                  ${animated ? 'animate-scale-in' : ''}
                `}
                style={{
                  animationDelay: animated ? `${index * 50}ms` : '0ms',
                }}
                size={config.icon}
                fill="currentColor"
              />
            ))}
            {hasMore && (
              <span className={`
                ml-1 
                text-xs 
                font-medium
                text-amber-600/80
                px-1.5 
                py-0.5 
                rounded-full 
                bg-amber-50
                border
                border-amber-200
                ${animated ? 'animate-fade-in' : ''}
              `}>
                +{points - config.maxDisplay}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-amber-50 border-amber-200">
          <p className="text-amber-900 font-medium">
            {points} point{points > 1 ? 's' : ''} 🍪
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
