/**
 * Bouton pour compléter l'évaluation d'un projet clôturé
 * S'affiche uniquement pour les projets avec closure_status = 'pending_evaluation'
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileCheck } from "lucide-react";
import { ProjectClosureDialog } from "./closure/ProjectClosureDialog";

interface CompleteEvaluationButtonProps {
  projectId: string;
  projectTitle: string;
  onComplete?: () => void;
}

export const CompleteEvaluationButton = ({
  projectId,
  projectTitle,
  onComplete,
}: CompleteEvaluationButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="text-orange-600 border-orange-300 hover:bg-orange-50"
      >
        <FileCheck className="h-4 w-4 mr-2" />
        Compléter l'évaluation
      </Button>

      <ProjectClosureDialog
        projectId={projectId}
        projectTitle={projectTitle}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onClosureComplete={onComplete}
        pendingEvaluationMode={true}
      />
    </>
  );
};
