/**
 * @component PointsVisualization
 * @description Composant parent qui gère l'affichage des points selon le mode de visualisation
 * choisi par l'utilisateur (classique ou cookies).
 */
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ClassicPoints } from "./ClassicPoints";
import { CookiePoints } from "./CookiePoints";

interface PointsVisualizationProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Activer l'animation d'apparition progressive */
  animated?: boolean;
}

export const PointsVisualization = ({ points, size = 'md', className, animated = true }: PointsVisualizationProps) => {
  const { getPreference } = useUserPreferences();
  const visualizationMode = getPreference('points_visualization_mode', 'classic') as 'classic' | 'cookies';

  if (visualizationMode === 'cookies') {
    return <CookiePoints points={points} size={size} className={className} animated={animated} />;
  }

  return <ClassicPoints points={points} size={size} className={className} />;
};
