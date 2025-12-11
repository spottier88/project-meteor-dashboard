/**
 * @file PortfolioPresentation.tsx
 * @description Page de présentation interactive des projets d'un portefeuille.
 * Affiche les projets sous forme de slides navigables, triés par météo.
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { usePortfolioDetails } from "@/hooks/usePortfolioDetails";
import { useDetailedProjectsData, ProjectData } from "@/hooks/use-detailed-projects-data";
import { PresentationView } from "@/components/presentation/PresentationView";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";

/**
 * Fonction pour obtenir l'ordre de priorité de la météo
 */
const getWeatherPriority = (weather: string | null | undefined): number => {
  switch (weather) {
    case "sunny":
      return 1;
    case "cloudy":
      return 2;
    case "stormy":
      return 3;
    default:
      return 4;
  }
};

/**
 * Fonction de tri des projets détaillés selon la météo (orageux en premier)
 */
const sortProjectsByWeather = (projects: ProjectData[]): ProjectData[] => {
  return [...projects].sort((a, b) => {
    const weatherA = a.lastReview?.weather;
    const weatherB = b.lastReview?.weather;
    // Tri décroissant : stormy (3) > cloudy (2) > sunny (1)
    return getWeatherPriority(weatherB) - getWeatherPriority(weatherA);
  });
};

/**
 * Page de présentation des projets d'un portefeuille
 */
export const PortfolioPresentation = () => {
  const { id: portfolioId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Charger les données du portefeuille pour obtenir la liste des projets
  const { 
    data: portfolio, 
    isLoading: isLoadingPortfolio 
  } = usePortfolioDetails(portfolioId!);

  // Extraire les IDs des projets du portefeuille
  const projectIds = portfolio?.projects?.map(p => p.id) || [];

  // Charger les données détaillées des projets
  const { 
    data: projectsData, 
    isLoading: isLoadingDetails 
  } = useDetailedProjectsData(
    projectIds,
    projectIds.length > 0
  );

  // Trier les projets par météo (orageux en premier)
  const sortedProjects = projectsData ? sortProjectsByWeather(projectsData) : [];

  // Fonction de sortie du mode présentateur
  const handleExit = () => {
    navigate(`/portfolios/${portfolioId}`);
  };

  // Si le portefeuille n'a pas de projets
  if (!isLoadingPortfolio && (!portfolio || portfolio.projects.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Briefcase className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Aucun projet dans le portefeuille</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Ce portefeuille ne contient aucun projet à présenter.
          Ajoutez des projets au portefeuille pour démarrer une présentation.
        </p>
        <Link to={`/portfolios/${portfolioId}`}>
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au portefeuille
          </Button>
        </Link>
      </div>
    );
  }

  // Chargement des données
  if (isLoadingPortfolio || isLoadingDetails || !projectsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOverlay message="Chargement des données de présentation..." />
      </div>
    );
  }

  return (
    <PresentationView
      projects={sortedProjects}
      onExit={handleExit}
      showSummary={sortedProjects.length > 1}
    />
  );
};

export default PortfolioPresentation;
