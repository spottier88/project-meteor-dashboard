/**
 * Indicateur de progression pour le processus de clôture de projet
 * Affiche les étapes et l'état actuel
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClosureStep } from "@/types/project-closure";

interface ClosureProgressIndicatorProps {
  currentStep: ClosureStep;
}

const steps: { key: ClosureStep; label: string }[] = [
  { key: 'intro', label: 'Introduction' },
  { key: 'final_review', label: 'Bilan projet' },
  { key: 'method_evaluation', label: 'Évaluation méthode' },
  { key: 'confirmation', label: 'Confirmation' },
];

export const ClosureProgressIndicator = ({ currentStep }: ClosureProgressIndicatorProps) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center max-w-[80px]",
                  isCurrent && "font-medium text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-20px]",
                  index < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
