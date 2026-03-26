/**
 * @file PresentationNavigation.tsx
 * @description Barre de navigation pour le mode présentateur avec
 * boutons précédent/suivant, indicateur de progression et contrôles.
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Home,
  StickyNote,
  ArrowUpDown,
} from "lucide-react";

/** Options de tri disponibles */
export type SortOption = "weather" | "completion" | "alpha" | "lifecycle";

const sortLabels: Record<SortOption, string> = {
  weather: "Météo",
  completion: "Avancement",
  alpha: "Alphabétique",
  lifecycle: "Cycle de vie",
};

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
  /** Callback pour ajouter une note — masqué si non fourni (slide de synthèse) */
  onAddNote?: () => void;
  /** Option de tri sélectionnée */
  sortOption?: SortOption;
  /** Callback de changement de tri */
  onSortChange?: (sort: SortOption) => void;
  /** Afficher le sélecteur de tri (> 1 projet) */
  showSort?: boolean;

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
  onAddNote,
  sortOption,
  onSortChange,
  showSort = false,
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

      {/* Bouton ajout de note */}
      {onAddNote && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddNote}
          className="gap-2"
          title="Ajouter une note"
        >
          <StickyNote className="h-4 w-4" />
          <span className="hidden sm:inline">Note</span>
        </Button>
      )}

      {/* Sélecteur de tri */}
      {showSort && sortOption && onSortChange && (
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
