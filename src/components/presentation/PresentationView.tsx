/**
 * @file PresentationView.tsx
 * @description Conteneur principal du mode présentateur gérant
 * l'affichage des slides et la navigation.
 */

import { ProjectData } from "@/hooks/use-detailed-projects-data";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { PresentationSlide } from "./PresentationSlide";
import { PresentationNavigation } from "./PresentationNavigation";
import { PresentationSummary } from "./PresentationSummary";

interface PresentationViewProps {
  projects: ProjectData[];
  onExit: () => void;
  showSummary?: boolean;
}

export const PresentationView = ({
  projects,
  onExit,
  showSummary = true,
}: PresentationViewProps) => {
  // Nombre total de slides (synthèse optionnelle + projets)
  const totalSlides = showSummary ? projects.length + 1 : projects.length;

  const {
    currentIndex,
    isFullscreen,
    goToNext,
    goToPrevious,
    goToIndex,
    toggleFullscreen,
    isFirstSlide,
    isLastSlide,
    progress,
  } = usePresentationMode({
    totalSlides,
    onExit,
  });

  // Déterminer si on affiche la synthèse ou un projet
  const isSummarySlide = showSummary && currentIndex === 0;
  const projectIndex = showSummary ? currentIndex - 1 : currentIndex;
  const currentProject = isSummarySlide ? null : projects[projectIndex];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Zone de contenu principale */}
      <div className="flex-1 overflow-hidden">
        {isSummarySlide ? (
          <PresentationSummary
            projects={projects}
            onProjectClick={(index) => goToIndex(index + 1)}
          />
        ) : currentProject ? (
          <PresentationSlide data={currentProject} />
        ) : null}
      </div>

      {/* Barre de navigation */}
      <PresentationNavigation
        currentIndex={currentIndex}
        totalSlides={totalSlides}
        isFullscreen={isFullscreen}
        isFirstSlide={isFirstSlide}
        isLastSlide={isLastSlide}
        progress={progress}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToggleFullscreen={toggleFullscreen}
        onExit={onExit}
      />
    </div>
  );
};
