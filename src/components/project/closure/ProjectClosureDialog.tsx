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

/**
 * Nettoie les pointer-events résiduels après fermeture de modale
 * Radix UI peut parfois laisser pointer-events: none après fermeture
 */
const unlockPointerEvents = () => {
  document.body.style.pointerEvents = "";
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.removeProperty("pointer-events");
};

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
    // Nouvelles fonctions pour la gestion des données existantes
    existingData,
    checkingExistingData,
    checkExistingClosureData,
    deleteExistingClosureData,
  } = useProjectClosure({
    projectId,
    onClosureComplete: () => {
      onClosureComplete?.();
      onClose();
    },
  });

  // Fonction de fermeture avec nettoyage du focus
  const handleClose = () => {
    unlockPointerEvents();
    document.body.focus();
    onClose();
  };

  // Réinitialiser l'état à l'ouverture du dialogue
  useEffect(() => {
    if (isOpen) {
      resetClosure();
      // Si mode évaluation en attente, aller directement à l'étape d'évaluation
      if (pendingEvaluationMode) {
        goToStep('method_evaluation');
      } else {
        // Vérifier si des données de clôture existantes sont présentes
        checkExistingClosureData();
      }
    }
  }, [isOpen, resetClosure, pendingEvaluationMode, goToStep, checkExistingClosureData]);

  // Gérer le report de l'évaluation
  const handlePostpone = async () => {
    const success = await postponeEvaluation();
    if (success) {
      handleClose();
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
            onCancel={handleClose}
            existingData={existingData}
            checkingExistingData={checkingExistingData}
            onDeleteExistingData={deleteExistingClosureData}
          />
        );
      
      case 'final_review':
        return (
          <ClosureStepFinalReview
            initialData={closureState.finalReviewData}
            lastCompletion={lastCompletion}
            onSubmit={saveFinalReviewData}
            onBack={goToPreviousStep}
            isSubmitting={closureState.isSubmitting}
          />
        );
      
      case 'method_evaluation':
        return (
          <ClosureStepMethodEvaluation
            initialData={closureState.evaluationData}
            onSubmit={saveEvaluationData}
            onPostpone={handlePostpone}
            onBack={pendingEvaluationMode ? handleClose : goToPreviousStep}
            isSubmitting={closureState.isSubmitting}
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          unlockPointerEvents();
          document.body.focus();
        }}
      >
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
