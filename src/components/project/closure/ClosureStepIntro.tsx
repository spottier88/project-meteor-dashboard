/**
 * Étape d'introduction du processus de clôture
 * Présente le processus et les options disponibles
 * Gère également la détection et suppression des données de clôture existantes
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, FileText, Target, Trash2 } from "lucide-react";

/**
 * Interface pour les données de clôture existantes
 */
interface ExistingClosureData {
  hasFinalReview: boolean;
  hasEvaluation: boolean;
}

interface ClosureStepIntroProps {
  projectTitle: string;
  onContinue: () => void;
  onCancel: () => void;
  /** Données de clôture existantes (null si pas encore vérifié) */
  existingData?: ExistingClosureData | null;
  /** Indique si la vérification est en cours */
  checkingExistingData?: boolean;
  /** Fonction pour supprimer les données existantes */
  onDeleteExistingData?: () => Promise<boolean>;
}

export const ClosureStepIntro = ({ 
  projectTitle, 
  onContinue, 
  onCancel,
  existingData,
  checkingExistingData = false,
  onDeleteExistingData,
}: ClosureStepIntroProps) => {
  // État local pour la confirmation de suppression
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Vérifie si des données de clôture existent
  const hasExistingData = existingData && (existingData.hasFinalReview || existingData.hasEvaluation);

  /**
   * Gère la suppression des données existantes avec confirmation
   */
  const handleDeleteExistingData = async () => {
    if (!onDeleteExistingData) return;
    
    setIsDeleting(true);
    const success = await onDeleteExistingData();
    setIsDeleting(false);
    
    if (success) {
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Clôturer le projet</h2>
        <p className="text-muted-foreground">
          {projectTitle}
        </p>
      </div>

      {/* Avertissement si des données de clôture existent */}
      {hasExistingData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 dark:bg-amber-950/30 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-amber-800 dark:text-amber-400">Données de clôture existantes</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ce projet possède déjà des données de clôture :
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                {existingData?.hasFinalReview && (
                  <li>Une revue finale de projet</li>
                )}
                {existingData?.hasEvaluation && (
                  <li>Une évaluation de la méthode projet</li>
                )}
              </ul>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Pour créer une nouvelle clôture, vous devez d'abord supprimer ces données.
              </p>
            </div>
          </div>
          
          {!showDeleteConfirmation ? (
            <Button
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/50"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer les anciennes données
            </Button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Êtes-vous sûr de vouloir supprimer ces données ?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteExistingData}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Confirmer la suppression"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          La clôture d'un projet se déroule en deux étapes essentielles pour capitaliser sur l'expérience acquise :
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Niveau 1 : Bilan du projet</h3>
              <p className="text-xs text-muted-foreground">
                Revue finale du projet : météo, état d'avancement final, difficultés rencontrées.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Niveau 2 : Évaluation de la méthode</h3>
              <p className="text-xs text-muted-foreground">
                Retour d'expérience : ce qui a bien fonctionné, ce qui a manqué, pistes d'amélioration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Reporter l'évaluation</h3>
            <p className="text-xs text-muted-foreground">
              Vous pourrez reporter l'évaluation de la méthode après avoir complété le bilan du projet.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          onClick={onContinue}
          disabled={checkingExistingData || hasExistingData}
        >
          {checkingExistingData ? "Vérification..." : "Commencer la clôture"}
        </Button>
      </div>
    </div>
  );
};
