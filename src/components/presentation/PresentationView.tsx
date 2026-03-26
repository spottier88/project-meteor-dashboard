/**
 * @file PresentationView.tsx
 * @description Conteneur principal du mode présentateur gérant
 * l'affichage des slides, la navigation et le tri dynamique des projets.
 */

import { useState, useMemo } from "react";
import { ProjectData } from "@/hooks/useDetailedProjectsData";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { PresentationSlide } from "./PresentationSlide";
import { PresentationNavigation, SortOption } from "./PresentationNavigation";
import { PresentationSummary } from "./PresentationSummary";
import { PresentationNoteDialog } from "./PresentationNoteDialog";

interface PresentationViewProps {
  projects: ProjectData[];
  onExit: () => void;
  showSummary?: boolean;
}

/** Priorité météo pour le tri (orageux d'abord) */
const getWeatherPriority = (weather: string | null | undefined): number => {
  switch (weather) {
    case "stormy": return 1;
    case "cloudy": return 2;
    case "sunny": return 3;
    default: return 4;
  }
};

/** Priorité cycle de vie */
const getLifecyclePriority = (status: string): number => {
  switch (status) {
    case "study": return 1;
    case "in_progress": return 2;
    case "suspended": return 3;
    case "completed": return 4;
    case "abandoned": return 5;
    default: return 6;
  }
};

/** Applique le tri sur la liste de projets */
const sortProjects = (projects: ProjectData[], sortOption: SortOption): ProjectData[] => {
  return [...projects].sort((a, b) => {
    switch (sortOption) {
      case "weather":
        return getWeatherPriority(a.lastReview?.weather) - getWeatherPriority(b.lastReview?.weather);
      case "completion":
        return (a.lastReview?.completion ?? a.project.completion ?? 0) - (b.lastReview?.completion ?? b.project.completion ?? 0);
      case "alpha":
        return a.project.title.localeCompare(b.project.title, "fr");
      case "lifecycle":
        return getLifecyclePriority(a.project.lifecycle_status) - getLifecyclePriority(b.project.lifecycle_status);
      default:
        return 0;
    }
  });
};

export const PresentationView = ({
  projects,
  onExit,
  showSummary = true,
}: PresentationViewProps) => {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("weather");

  /** Projets triés dynamiquement */
  const sortedProjects = useMemo(
    () => sortProjects(projects, sortOption),
    [projects, sortOption]
  );

  const totalSlides = showSummary ? sortedProjects.length + 1 : sortedProjects.length;

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

  const isSummarySlide = showSummary && currentIndex === 0;
  const projectIndex = showSummary ? currentIndex - 1 : currentIndex;
  const currentProject = isSummarySlide ? null : sortedProjects[projectIndex];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Zone de contenu principale */}
      <div className="flex-1 overflow-hidden">
        {isSummarySlide ? (
          <PresentationSummary
            projects={sortedProjects}
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
        onAddNote={currentProject ? () => setIsNoteDialogOpen(true) : undefined}
        sortOption={sortOption}
        onSortChange={setSortOption}
        showSort={projects.length > 1}
      />

      {/* Dialogue d'ajout de note */}
      {currentProject && (
        <PresentationNoteDialog
          projectId={currentProject.project.id}
          projectTitle={currentProject.project.title}
          isOpen={isNoteDialogOpen}
          onClose={() => setIsNoteDialogOpen(false)}
        />
      )}
    </div>
  );
};
