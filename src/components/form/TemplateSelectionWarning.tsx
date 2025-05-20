
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TemplateSelectionWarningProps {
  isEditMode: boolean;
  templateSelected: boolean;
}

export const TemplateSelectionWarning = ({
  isEditMode,
  templateSelected,
}: TemplateSelectionWarningProps) => {
  if (!isEditMode || !templateSelected) return null;

  return (
    <Alert variant="warning" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Attention</AlertTitle>
      <AlertDescription>
        Vous êtes en train de modifier un projet existant. Sélectionner un modèle
        ajoutera de nouvelles tâches au projet sans supprimer les tâches existantes.
      </AlertDescription>
    </Alert>
  );
};
