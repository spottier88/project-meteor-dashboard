/**
 * Étape d'évaluation de la méthode projet (Niveau 2)
 * Formulaire de retour d'expérience sur la conduite du projet
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, AlertCircle, Lightbulb, GraduationCap, Clock } from "lucide-react";
import { EvaluationFormData } from "@/types/project-closure";

interface ClosureStepMethodEvaluationProps {
  initialData?: EvaluationFormData | null;
  onSubmit: (data: EvaluationFormData) => void;
  onPostpone: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const ClosureStepMethodEvaluation = ({
  initialData,
  onSubmit,
  onPostpone,
  onBack,
  isSubmitting = false,
}: ClosureStepMethodEvaluationProps) => {
  const [whatWorked, setWhatWorked] = useState(initialData?.what_worked || '');
  const [whatWasMissing, setWhatWasMissing] = useState(initialData?.what_was_missing || '');
  const [improvements, setImprovements] = useState(initialData?.improvements || '');
  const [lessonsLearned, setLessonsLearned] = useState(initialData?.lessons_learned || '');

  useEffect(() => {
    if (initialData) {
      setWhatWorked(initialData.what_worked);
      setWhatWasMissing(initialData.what_was_missing);
      setImprovements(initialData.improvements);
      setLessonsLearned(initialData.lessons_learned);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit({
      what_worked: whatWorked,
      what_was_missing: whatWasMissing,
      improvements,
      lessons_learned: lessonsLearned,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Évaluation de la méthode</h2>
        <p className="text-sm text-muted-foreground">
          Partagez votre retour d'expérience sur la conduite du projet
        </p>
      </div>

      {/* Ce qui a bien fonctionné */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-green-600" />
          <Label htmlFor="what-worked">Ce qui a bien fonctionné</Label>
        </div>
        <Textarea
          id="what-worked"
          value={whatWorked}
          onChange={(e) => setWhatWorked(e.target.value)}
          placeholder="Décrivez les aspects positifs de la gestion du projet : outils, communication, organisation..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Ce qui a manqué */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <Label htmlFor="what-was-missing">Ce qui a manqué</Label>
        </div>
        <Textarea
          id="what-was-missing"
          value={whatWasMissing}
          onChange={(e) => setWhatWasMissing(e.target.value)}
          placeholder="Identifiez ce qui a fait défaut : ressources, compétences, temps, soutien..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Pistes d'amélioration */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-600" />
          <Label htmlFor="improvements">Pistes d'amélioration</Label>
        </div>
        <Textarea
          id="improvements"
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="Proposez des améliorations pour les projets futurs : processus, outils, méthodes..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Enseignements tirés */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <Label htmlFor="lessons-learned">Enseignements tirés</Label>
        </div>
        <Textarea
          id="lessons-learned"
          value={lessonsLearned}
          onChange={(e) => setLessonsLearned(e.target.value)}
          placeholder="Résumez les principales leçons à retenir de ce projet..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onPostpone}
            disabled={isSubmitting}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Clock className="h-4 w-4 mr-2" />
            Reporter l'évaluation
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};
