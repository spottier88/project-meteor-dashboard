/**
 * Étape d'introduction du processus de clôture
 * Présente le processus et les options disponibles
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, FileText, Target } from "lucide-react";

interface ClosureStepIntroProps {
  projectTitle: string;
  onContinue: () => void;
  onCancel: () => void;
}

export const ClosureStepIntro = ({ 
  projectTitle, 
  onContinue, 
  onCancel 
}: ClosureStepIntroProps) => {
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
        <Button onClick={onContinue}>
          Commencer la clôture
        </Button>
      </div>
    </div>
  );
};
