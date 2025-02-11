
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProjectFormHeaderProps {
  currentStep: number;
  isEditing: boolean;
}

export const ProjectFormHeader = ({ currentStep, isEditing }: ProjectFormHeaderProps) => {
  return (
    <DialogHeader className="space-y-3">
      <DialogTitle>
        {isEditing ? "Modifier le projet" : "Nouveau projet"}
      </DialogTitle>
      <DialogDescription>
        {currentStep === 0 
          ? "Étape 1: Informations générales du projet" 
          : currentStep === 1
          ? "Étape 2: Organisation et niveau de suivi"
          : "Étape 3: Critères d'innovation"}
      </DialogDescription>
      <Progress value={(currentStep + 1) * 33.33} className="h-2" />
    </DialogHeader>
  );
};
