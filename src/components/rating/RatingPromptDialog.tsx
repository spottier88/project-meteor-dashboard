/**
 * @component RatingPromptDialog
 * @description Modale de relance proposant à l'utilisateur d'évaluer l'application.
 * S'auto-ouvre quand `useRatingPrompt.shouldShowPrompt` est vrai.
 * Trois actions possibles :
 *  - Envoyer un avis (StarRating + commentaire) → submitRating
 *  - Plus tard → snooze (report d'une fréquence)
 *  - Ne plus me demander → opt-out définitif
 */

import { useEffect, useRef, useState } from "react";
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
import { Star, Clock, BellOff } from "lucide-react";
import { StarRating } from "./StarRating";
import { useAppRating } from "@/hooks/useAppRating";
import { useRatingPrompt } from "@/hooks/useRatingPrompt";

export const RatingPromptDialog = () => {
  const { shouldShowPrompt, snooze, optOut } = useRatingPrompt();
  const { submitRating, isSubmitting } = useAppRating();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const hasOpenedRef = useRef(false);

  // Ouverture unique par montage quand les conditions sont réunies
  useEffect(() => {
    if (shouldShowPrompt && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setIsOpen(true);
    }
  }, [shouldShowPrompt]);

  const handleSubmit = () => {
    if (rating === 0) return;
    submitRating(
      { rating, comment },
      {
        onSuccess: () => setIsOpen(false),
      }
    );
  };

  const handleSnooze = () => {
    snooze();
    setIsOpen(false);
  };

  const handleOptOut = () => {
    optOut();
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Fermeture via croix ou Echap = équivalent à un report
          handleSnooze();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Donnez-nous votre avis
          </DialogTitle>
          <DialogDescription>
            Votre retour nous aide à améliorer l'application. Cela ne prend que quelques secondes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <span className="text-sm text-muted-foreground">
              {rating === 0 && "Cliquez pour noter"}
              {rating === 1 && "Très insatisfait"}
              {rating === 2 && "Insatisfait"}
              {rating === 3 && "Neutre"}
              {rating === 4 && "Satisfait"}
              {rating === 5 && "Très satisfait"}
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="rating-prompt-comment" className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              id="rating-prompt-comment"
              placeholder="Partagez vos suggestions, remarques ou difficultés rencontrées..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSnooze}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              <Clock className="h-4 w-4 mr-1" />
              Plus tard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOptOut}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none text-muted-foreground"
            >
              <BellOff className="h-4 w-4 mr-1" />
              Ne plus me demander
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? "Envoi..." : "Envoyer mon avis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
