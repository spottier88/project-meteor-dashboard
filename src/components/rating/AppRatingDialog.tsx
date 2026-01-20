/**
 * @component AppRatingDialog
 * @description Dialog modal pour saisir ou modifier son évaluation de l'application
 * Affiche 5 étoiles interactives et une zone de commentaire optionnelle
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { useAppRating } from "@/hooks/useAppRating";

interface AppRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppRatingDialog = ({ open, onOpenChange }: AppRatingDialogProps) => {
  const { userRating, submitRating, isSubmitting } = useAppRating();
  
  // État local pour le formulaire
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Initialiser avec les valeurs existantes si présentes
  useEffect(() => {
    if (open && userRating) {
      setRating(userRating.rating);
      setComment(userRating.comment || "");
    } else if (open) {
      setRating(0);
      setComment("");
    }
  }, [open, userRating]);

  const handleSubmit = () => {
    if (rating === 0) return;
    
    submitRating(
      { rating, comment },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isValid = rating > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⭐ Évaluez l'application
          </DialogTitle>
          <DialogDescription>
            Votre avis nous aide à améliorer l'application. Merci de prendre quelques secondes pour nous donner votre retour.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection des étoiles */}
          <div className="flex flex-col items-center gap-2">
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
            />
            <span className="text-sm text-muted-foreground">
              {rating === 0 && "Cliquez pour noter"}
              {rating === 1 && "Très insatisfait"}
              {rating === 2 && "Insatisfait"}
              {rating === 3 && "Neutre"}
              {rating === 4 && "Satisfait"}
              {rating === 5 && "Très satisfait"}
            </span>
          </div>

          {/* Zone de commentaire */}
          <div className="space-y-2">
            <label htmlFor="rating-comment" className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              id="rating-comment"
              placeholder="Partagez vos suggestions, remarques ou difficultés rencontrées..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Indication si modification */}
          {userRating && (
            <p className="text-xs text-muted-foreground text-center">
              Vous avez déjà évalué l'application. Cette action modifiera votre évaluation précédente.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Envoi..." : userRating ? "Modifier mon avis" : "Envoyer mon avis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
