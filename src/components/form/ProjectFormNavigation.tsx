
import { Button } from "@/components/ui/button";

interface ProjectFormNavigationProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  isEditMode: boolean;
  isSubmitting: boolean;
  canGoNext?: boolean;
  isLastStep?: boolean;
  onClose?: () => void;
}

export const ProjectFormNavigation = ({
  currentStep,
  onPrevious,
  onNext,
  isEditMode,
  isSubmitting,
  canGoNext = true,
  isLastStep = currentStep === 3,
  onClose,
}: ProjectFormNavigationProps) => {
  return (
    <div className="flex justify-between space-x-2">
      {currentStep > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Précédent
        </Button>
      )}
      <div className="flex space-x-2">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
        >
          {isLastStep ? (isSubmitting ? "Enregistrement..." : "Enregistrer") : "Suivant"}
        </Button>
      </div>
    </div>
  );
};
