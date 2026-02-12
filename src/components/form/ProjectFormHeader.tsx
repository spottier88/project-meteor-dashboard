
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Labels des étapes du formulaire projet */
const STEP_LABELS = [
  "Général",
  "Organisation",
  "Innovation",
  "Cadrage",
  "Compléments",
];

interface ProjectFormHeaderProps {
  currentStep: number;
  isEditMode: boolean;
  title?: string;
  /** Callback pour naviguer directement à une étape */
  onStepClick?: (step: number) => void;
}

/**
 * En-tête du formulaire projet avec indicateur d'étapes cliquables
 */
export const ProjectFormHeader = ({ currentStep, isEditMode, title, onStepClick }: ProjectFormHeaderProps) => {
  return (
    <DialogHeader className="space-y-3">
      <DialogTitle>
        {isEditMode ? `Modifier le projet ${title ? `"${title}"` : ""}` : "Nouveau projet"}
      </DialogTitle>
      {/* Indicateur d'étapes cliquables */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onStepClick?.(index)}
            className={cn(
              "flex-1 text-xs py-1.5 px-1 rounded-md transition-colors text-center",
              "hover:bg-accent/50 cursor-pointer",
              index === currentStep
                ? "bg-primary text-primary-foreground font-medium"
                : index < currentStep
                ? "bg-primary/20 text-primary font-medium"
                : "bg-muted text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </DialogHeader>
  );
};
