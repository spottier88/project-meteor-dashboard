/**
 * @file ProjectPortfoliosBadges.tsx
 * @description Composant affichant les badges des portefeuilles associés à un projet
 * Permet la navigation vers chaque portefeuille
 */

import { useProjectPortfolios } from "@/hooks/useProjectPortfolios";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectPortfoliosBadgesProps {
  projectId: string;
  /** Mode compact pour les cartes (moins de détails) */
  compact?: boolean;
  /** Nombre maximum de badges à afficher avant affichage condensé */
  maxVisible?: number;
}

/**
 * Affiche les badges des portefeuilles associés à un projet
 * Chaque badge est cliquable et redirige vers le portefeuille
 */
export const ProjectPortfoliosBadges = ({ 
  projectId, 
  compact = false,
  maxVisible = 3 
}: ProjectPortfoliosBadgesProps) => {
  const navigate = useNavigate();
  const { data: portfolios, isLoading } = useProjectPortfolios(projectId);

  // Ne rien afficher si pas de portefeuilles
  if (!isLoading && (!portfolios || portfolios.length === 0)) {
    return null;
  }

  // Afficher un skeleton pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  const handlePortfolioClick = (e: React.MouseEvent, portfolioId: string) => {
    e.stopPropagation(); // Empêcher la propagation au parent (carte projet)
    navigate(`/portfolios/${portfolioId}`);
  };

  // Déterminer les portefeuilles visibles et le nombre restant
  const visiblePortfolios = portfolios!.slice(0, maxVisible);
  const remainingCount = portfolios!.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!compact && (
        <span className="text-xs text-muted-foreground mr-1">
          Portefeuilles :
        </span>
      )}
      {visiblePortfolios.map((portfolio) => (
        <Badge
          key={portfolio.portfolio_id}
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 transition-colors flex items-center gap-1 text-xs"
          onClick={(e) => handlePortfolioClick(e, portfolio.portfolio_id)}
          data-no-navigate
        >
          <FolderOpen className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{portfolio.portfolio_name}</span>
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-xs cursor-default"
          data-no-navigate
        >
          +{remainingCount} autre{remainingCount > 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
};

export default ProjectPortfoliosBadges;
