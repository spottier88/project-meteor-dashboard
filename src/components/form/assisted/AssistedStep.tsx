/**
 * Layout générique d'une micro-étape du wizard assisté.
 * Affiche un titre centré, un sous-titre, le contenu du formulaire,
 * et les boutons de navigation.
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { TOTAL_ASSISTED_STEPS } from "./AssistedStepConfig";

interface AssistedStepProps {
  /** Index de l'étape courante (0-indexed) */
  currentStep: number;
  /** Titre principal */
  title: string;
  /** Sous-titre explicatif */
  subtitle: string;
  /** L'étape est optionnelle (affiche le bouton Passer) */
  optional: boolean;
  /** Contenu du formulaire */
  children: React.ReactNode;
  /** Aller à l'étape précédente */
  onPrevious: () => void;
  /** Aller à l'étape suivante */
  onNext: () => void;
  /** Passer cette étape (optionnelle uniquement) */
  onSkip?: () => void;
  /** Désactiver le bouton Suivant */
  canGoNext?: boolean;
  /** Texte personnalisé du bouton suivant */
  nextLabel?: string;
  /** En cours de soumission */
  isSubmitting?: boolean;
}

export const AssistedStep = ({
  currentStep,
  title,
  subtitle,
  optional,
  children,
  onPrevious,
  onNext,
  onSkip,
  canGoNext = true,
  nextLabel,
  isSubmitting = false,
}: AssistedStepProps) => {
  const progress = ((currentStep + 1) / TOTAL_ASSISTED_STEPS) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Barre de progression */}
      <div className="space-y-1 mb-6">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Étape {currentStep + 1}/{TOTAL_ASSISTED_STEPS}</span>
          {optional && (
            <span className="text-primary/70 italic">Optionnelle</span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Titre et sous-titre */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Contenu du formulaire */}
      <div className="flex-1 overflow-auto px-1">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <div>
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isSubmitting}
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {optional && onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              size="sm"
            >
              Passer
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            size="sm"
          >
            {nextLabel || "Suivant"}
            {!nextLabel && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
