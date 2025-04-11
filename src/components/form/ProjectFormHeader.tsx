
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProjectFormHeaderProps {
  currentStep: number;
  isEditMode: boolean;
  title?: string;
}

export const ProjectFormHeader = ({ currentStep, isEditMode, title }: ProjectFormHeaderProps) => {
  return (
    <DialogHeader className="space-y-3">
      <DialogTitle>
        {isEditMode ? `Modifier le projet ${title ? `"${title}"` : ""}` : "Nouveau projet"}
      </DialogTitle>
      <DialogDescription>
        {currentStep === 0 
          ? "Étape 1: Informations générales du projet" 
          : currentStep === 1
          ? "Étape 2: Organisation et niveau de suivi"
          : currentStep === 2
          ? "Étape 3: Critères d'innovation"
          : currentStep === 3
          ? "Étape 4: Cadrage du projet"
          : "Étape 5: Informations complémentaires"}
      </DialogDescription>
      <Progress value={(currentStep + 1) * 25} className="h-2" />
    </DialogHeader>
  );
};
