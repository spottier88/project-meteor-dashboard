/**
 * @file PortfolioReviewForm.tsx
 * @description Formulaire de création/modification d'une revue de portefeuille
 */

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PortfolioReviewFormProps {
  /** État d'ouverture du formulaire */
  open: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** Callback de soumission */
  onSubmit: (data: { subject: string; review_date: string; notes?: string }) => void;
  /** Indique si une soumission est en cours */
  isSubmitting?: boolean;
  /** Données initiales pour édition */
  initialData?: {
    subject: string;
    review_date: string;
    notes?: string | null;
  };
}

/**
 * Formulaire pour organiser une nouvelle revue de projets
 */
export const PortfolioReviewForm = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
}: PortfolioReviewFormProps) => {
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [date, setDate] = useState<Date | undefined>(
    initialData?.review_date ? new Date(initialData.review_date) : undefined
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !date) return;

    onSubmit({
      subject: subject.trim(),
      review_date: format(date, "yyyy-MM-dd"),
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubject(initialData?.subject || "");
      setDate(initialData?.review_date ? new Date(initialData.review_date) : undefined);
      setNotes(initialData?.notes || "");
      onClose();
    }
  };

  const isValid = subject.trim() && date;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.body.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la revue" : "Organiser une revue de projets"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la revue de projets."
              : "Planifiez une nouvelle revue pour les projets du portefeuille."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Objet de la revue */}
          <div className="space-y-2">
            <Label htmlFor="subject">Objet de la revue *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Revue mensuelle Q4 2024"
              disabled={isSubmitting}
            />
          </div>

          {/* Date de la revue */}
          <div className="space-y-2">
            <Label>Date de la revue *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting
                ? "Enregistrement..."
                : isEditing
                ? "Modifier"
                : "Créer la revue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
