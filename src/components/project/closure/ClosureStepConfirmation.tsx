/**
 * Étape de confirmation de la clôture du projet
 * Affiche un récapitulatif et permet de valider la clôture
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, Sun, Cloud, CloudRain, TrendingUp, Minus, TrendingDown, Loader2 } from "lucide-react";
import { FinalReviewFormData, EvaluationFormData } from "@/types/project-closure";

interface ClosureStepConfirmationProps {
  projectTitle: string;
  finalReviewData: FinalReviewFormData | null;
  evaluationData: EvaluationFormData | null;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const weatherIcons = {
  sunny: { icon: Sun, label: 'Ensoleillé', className: 'text-yellow-500' },
  cloudy: { icon: Cloud, label: 'Nuageux', className: 'text-gray-500' },
  stormy: { icon: CloudRain, label: 'Orageux', className: 'text-blue-500' },
};

const progressIcons = {
  better: { icon: TrendingUp, label: 'En amélioration', className: 'text-green-500' },
  stable: { icon: Minus, label: 'Stable', className: 'text-yellow-500' },
  worse: { icon: TrendingDown, label: 'En dégradation', className: 'text-red-500' },
};

export const ClosureStepConfirmation = ({
  projectTitle,
  finalReviewData,
  evaluationData,
  onConfirm,
  onBack,
  isSubmitting = false,
}: ClosureStepConfirmationProps) => {
  const WeatherIcon = finalReviewData ? weatherIcons[finalReviewData.weather].icon : Sun;
  const ProgressIcon = finalReviewData ? progressIcons[finalReviewData.progress].icon : Minus;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">Confirmer la clôture</h2>
        <p className="text-sm text-muted-foreground">
          Vérifiez les informations avant de clôturer définitivement le projet
        </p>
      </div>

      {/* Récapitulatif du bilan */}
      {finalReviewData && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">Bilan du projet</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Météo :</span>
              <WeatherIcon className={`h-4 w-4 ${weatherIcons[finalReviewData.weather].className}`} />
              <span>{weatherIcons[finalReviewData.weather].label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Progression :</span>
              <ProgressIcon className={`h-4 w-4 ${progressIcons[finalReviewData.progress].className}`} />
              <span>{progressIcons[finalReviewData.progress].label}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Avancement :</span>
              <span className="ml-2 font-medium">{finalReviewData.completion}%</span>
            </div>
          </div>

          {finalReviewData.comment && (
            <div>
              <span className="text-muted-foreground text-xs">Bilan :</span>
              <p className="text-sm mt-1 line-clamp-2">{finalReviewData.comment}</p>
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif de l'évaluation */}
      {evaluationData && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">Évaluation de la méthode</h3>
          
          <div className="space-y-2 text-sm">
            {evaluationData.what_worked && (
              <div>
                <span className="text-muted-foreground text-xs">Points positifs :</span>
                <p className="line-clamp-2">{evaluationData.what_worked}</p>
              </div>
            )}
            {evaluationData.what_was_missing && (
              <div>
                <span className="text-muted-foreground text-xs">Points manquants :</span>
                <p className="line-clamp-2">{evaluationData.what_was_missing}</p>
              </div>
            )}
            {evaluationData.improvements && (
              <div>
                <span className="text-muted-foreground text-xs">Améliorations :</span>
                <p className="line-clamp-2">{evaluationData.improvements}</p>
              </div>
            )}
            {evaluationData.lessons_learned && (
              <div>
                <span className="text-muted-foreground text-xs">Enseignements :</span>
                <p className="line-clamp-2">{evaluationData.lessons_learned}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Avertissement */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
        <p>
          <strong>Attention :</strong> Une fois le projet clôturé, il passera au statut "Terminé" et les données de clôture ne pourront plus être modifiées.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Retour
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Clôture en cours...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Clôturer définitivement
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
