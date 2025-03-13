
import { Button } from "@/components/ui/button";

interface ProjectFormNavigationProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

export const ProjectFormNavigation = ({
  currentStep,
  onPrevious,
  onNext,
  canGoNext,
  isLastStep,
  isSubmitting,
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
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
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
