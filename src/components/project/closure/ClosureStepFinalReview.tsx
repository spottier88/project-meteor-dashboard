/**
 * Étape du bilan final du projet (Niveau 1)
 * Formulaire de revue finale avec météo, progression et commentaires
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Sun, Cloud, CloudRain, TrendingUp, Minus, TrendingDown, Clock } from "lucide-react";
import { FinalReviewFormData } from "@/types/project-closure";

interface ClosureStepFinalReviewProps {
  initialData?: FinalReviewFormData | null;
  lastCompletion?: number;
  onSubmit: (data: FinalReviewFormData) => void;
  onPostpone: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const ClosureStepFinalReview = ({
  initialData,
  lastCompletion = 0,
  onSubmit,
  onPostpone,
  onBack,
  isSubmitting = false,
}: ClosureStepFinalReviewProps) => {
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'stormy'>(
    initialData?.weather || 'sunny'
  );
  const [progress, setProgress] = useState<'better' | 'stable' | 'worse'>(
    initialData?.progress || 'stable'
  );
  const [completion, setCompletion] = useState<number>(
    initialData?.completion || lastCompletion || 100
  );
  const [comment, setComment] = useState(initialData?.comment || '');
  const [difficulties, setDifficulties] = useState(initialData?.difficulties || '');

  useEffect(() => {
    if (initialData) {
      setWeather(initialData.weather);
      setProgress(initialData.progress);
      setCompletion(initialData.completion);
      setComment(initialData.comment);
      setDifficulties(initialData.difficulties);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit({
      weather,
      progress,
      completion,
      comment,
      difficulties,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Bilan du projet</h2>
        <p className="text-sm text-muted-foreground">
          Évaluez le résultat final du projet
        </p>
      </div>

      {/* Météo du projet */}
      <div className="space-y-3">
        <Label>Météo finale du projet</Label>
        <RadioGroup
          value={weather}
          onValueChange={(value) => setWeather(value as 'sunny' | 'cloudy' | 'stormy')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sunny" id="weather-sunny" />
            <Label htmlFor="weather-sunny" className="flex items-center gap-1 cursor-pointer">
              <Sun className="h-5 w-5 text-yellow-500" />
              <span>Ensoleillé</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cloudy" id="weather-cloudy" />
            <Label htmlFor="weather-cloudy" className="flex items-center gap-1 cursor-pointer">
              <Cloud className="h-5 w-5 text-gray-500" />
              <span>Nuageux</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stormy" id="weather-stormy" />
            <Label htmlFor="weather-stormy" className="flex items-center gap-1 cursor-pointer">
              <CloudRain className="h-5 w-5 text-blue-500" />
              <span>Orageux</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Progression */}
      <div className="space-y-3">
        <Label>État de progression</Label>
        <RadioGroup
          value={progress}
          onValueChange={(value) => setProgress(value as 'better' | 'stable' | 'worse')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="better" id="progress-better" />
            <Label htmlFor="progress-better" className="flex items-center gap-1 cursor-pointer">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>En amélioration</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stable" id="progress-stable" />
            <Label htmlFor="progress-stable" className="flex items-center gap-1 cursor-pointer">
              <Minus className="h-4 w-4 text-yellow-500" />
              <span>Stable</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="worse" id="progress-worse" />
            <Label htmlFor="progress-worse" className="flex items-center gap-1 cursor-pointer">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span>En dégradation</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Avancement */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Avancement final</Label>
          <span className="text-sm font-medium">{completion}%</span>
        </div>
        <Slider
          value={[completion]}
          onValueChange={(value) => setCompletion(value[0])}
          max={100}
          min={0}
          step={5}
          className="w-full"
        />
      </div>

      {/* Commentaire bilan */}
      <div className="space-y-2">
        <Label htmlFor="comment">Bilan général</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Résumez le résultat du projet, les objectifs atteints..."
          rows={4}
        />
      </div>

      {/* Difficultés */}
      <div className="space-y-2">
        <Label htmlFor="difficulties">Difficultés rencontrées</Label>
        <Textarea
          id="difficulties"
          value={difficulties}
          onChange={(e) => setDifficulties(e.target.value)}
          placeholder="Listez les principales difficultés rencontrées au cours du projet..."
          rows={3}
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
