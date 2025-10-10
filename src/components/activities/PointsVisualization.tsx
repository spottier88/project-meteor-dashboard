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
}

export const PointsVisualization = ({ points, size = 'md', className }: PointsVisualizationProps) => {
  const { getPreference } = useUserPreferences();
  const visualizationMode = getPreference('points_visualization_mode', 'classic') as 'classic' | 'cookies';

  if (visualizationMode === 'cookies') {
    return <CookiePoints points={points} size={size} className={className} />;
  }

  return <ClassicPoints points={points} size={size} className={className} />;
};
