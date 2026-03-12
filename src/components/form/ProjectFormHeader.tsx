
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, Wand2 } from "lucide-react";

/** Labels des étapes du formulaire projet (mode classique) */
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
  /** Mode assisté activé */
  isAssistedMode?: boolean;
  /** Basculer entre mode classique et assisté */
  onToggleMode?: (assisted: boolean) => void;
}

/**
 * En-tête du formulaire projet avec indicateur d'étapes cliquables et toggle de mode
 */
export const ProjectFormHeader = ({
  currentStep,
  isEditMode,
  title,
  onStepClick,
  isAssistedMode = false,
  onToggleMode,
}: ProjectFormHeaderProps) => {
  return (
    <DialogHeader className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <DialogTitle className="flex-1">
          {isEditMode ? `Modifier le projet ${title ? `"${title}"` : ""}` : "Nouveau projet"}
        </DialogTitle>
        {/* Toggle mode classique / assisté */}
        {onToggleMode && (
          <ToggleGroup
            type="single"
            value={isAssistedMode ? "assisted" : "classic"}
            onValueChange={(value) => {
              if (value) onToggleMode(value === "assisted");
            }}
            className="border rounded-lg p-0.5"
          >
            <ToggleGroupItem value="classic" className="text-xs px-2.5 py-1 h-7 gap-1" aria-label="Mode classique">
              <List className="h-3 w-3" />
              Classique
            </ToggleGroupItem>
            <ToggleGroupItem value="assisted" className="text-xs px-2.5 py-1 h-7 gap-1" aria-label="Mode assisté">
              <Wand2 className="h-3 w-3" />
              Assisté
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      {/* Indicateur d'étapes cliquables (mode classique uniquement) */}
      {!isAssistedMode && (
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
      )}
    </DialogHeader>
  );
};
