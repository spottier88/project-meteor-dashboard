/**
 * @file PresentationNavigation.tsx
 * @description Barre de navigation pour le mode présentateur avec
 * boutons précédent/suivant, indicateur de progression et contrôles.
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Home,
} from "lucide-react";

interface PresentationNavigationProps {
  currentIndex: number;
  totalSlides: number;
  isFullscreen: boolean;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  progress: number;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
  onExit: () => void;
}

export const PresentationNavigation = ({
  currentIndex,
  totalSlides,
  isFullscreen,
  isFirstSlide,
  isLastSlide,
  progress,
  onPrevious,
  onNext,
  onToggleFullscreen,
  onExit,
}: PresentationNavigationProps) => {
  return (
    <div className="bg-background/95 backdrop-blur border-t px-4 py-2 flex items-center gap-4">
      {/* Bouton quitter */}
      <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Quitter</span>
      </Button>

      {/* Séparateur */}
      <div className="h-6 w-px bg-border" />

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={isFirstSlide}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium min-w-[80px] text-center">
          {currentIndex + 1} / {totalSlides}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={isLastSlide}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Barre de progression */}
      <div className="flex-1 max-w-md">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          className="h-8 w-8"
          title={isFullscreen ? "Quitter le plein écran (F)" : "Plein écran (F)"}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Raccourcis clavier (tooltip) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
        <span>←/→ Navigation</span>
        <span>•</span>
        <span>F Plein écran</span>
        <span>•</span>
        <span>Esc Quitter</span>
      </div>
    </div>
  );
};
