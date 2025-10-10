/**
 * @component ClassicPoints
 * @description Affichage classique (numérique) des points d'activité
 */
interface ClassicPointsProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ClassicPoints = ({ points, size = 'md', className = '' }: ClassicPointsProps) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {points} pts
    </span>
  );
};
