/**
 * Dialogue principal de clôture de projet
 * Orchestre les différentes étapes du processus de clôture
 */

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectClosure } from "@/hooks/useProjectClosure";
import { ClosureProgressIndicator } from "./ClosureProgressIndicator";
import { ClosureStepIntro } from "./ClosureStepIntro";
import { ClosureStepFinalReview } from "./ClosureStepFinalReview";
import { ClosureStepMethodEvaluation } from "./ClosureStepMethodEvaluation";
import { ClosureStepConfirmation } from "./ClosureStepConfirmation";

interface ProjectClosureDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onClosureComplete?: () => void;
  lastCompletion?: number;
  // Mode pour compléter une évaluation en attente
  pendingEvaluationMode?: boolean;
}

export const ProjectClosureDialog = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onClosureComplete,
  lastCompletion = 0,
  pendingEvaluationMode = false,
}: ProjectClosureDialogProps) => {
  const {
    closureState,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    saveFinalReviewData,
    saveEvaluationData,
    postponeEvaluation,
    submitClosure,
    completeEvaluation,
    resetClosure,
  } = useProjectClosure({
    projectId,
    onClosureComplete: () => {
      onClosureComplete?.();
      onClose();
    },
  });

  // Réinitialiser l'état à l'ouverture du dialogue
  useEffect(() => {
    if (isOpen) {
      resetClosure();
      // Si mode évaluation en attente, aller directement à l'étape d'évaluation
      if (pendingEvaluationMode) {
        goToStep('method_evaluation');
      }
    }
  }, [isOpen, resetClosure, pendingEvaluationMode, goToStep]);

  // Gérer le report de l'évaluation
  const handlePostpone = async () => {
    const success = await postponeEvaluation();
    if (success) {
      onClose();
    }
  };

  // Gérer la confirmation finale
  const handleConfirm = async () => {
    if (pendingEvaluationMode && closureState.evaluationData) {
      await completeEvaluation(closureState.evaluationData);
    } else {
      await submitClosure();
    }
  };

  // Rendu de l'étape courante
  const renderStep = () => {
    switch (closureState.currentStep) {
      case 'intro':
        return (
          <ClosureStepIntro
            projectTitle={projectTitle}
            onContinue={goToNextStep}
            onCancel={onClose}
          />
        );
      
      case 'final_review':
        return (
          <ClosureStepFinalReview
            initialData={closureState.finalReviewData}
            lastCompletion={lastCompletion}
            onSubmit={saveFinalReviewData}
            onPostpone={handlePostpone}
            onBack={goToPreviousStep}
            isSubmitting={closureState.isSubmitting}
          />
        );
      
      case 'method_evaluation':
        return (
          <ClosureStepMethodEvaluation
            initialData={closureState.evaluationData}
            onSubmit={saveEvaluationData}
            onBack={pendingEvaluationMode ? onClose : goToPreviousStep}
          />
        );
      
      case 'confirmation':
        return (
          <ClosureStepConfirmation
            projectTitle={projectTitle}
            finalReviewData={closureState.finalReviewData}
            evaluationData={closureState.evaluationData}
            onConfirm={handleConfirm}
            onBack={goToPreviousStep}
            isSubmitting={closureState.isSubmitting}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {pendingEvaluationMode ? "Compléter l'évaluation" : "Clôturer le projet"}
          </DialogTitle>
        </DialogHeader>

        {/* Indicateur de progression (masqué en mode évaluation pendante) */}
        {!pendingEvaluationMode && (
          <ClosureProgressIndicator currentStep={closureState.currentStep} />
        )}

        {/* Contenu de l'étape */}
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
