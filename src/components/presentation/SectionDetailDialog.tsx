/**
 * @file SectionDetailDialog.tsx
 * @description Dialogue modal pour afficher le contenu complet d'une section
 * de slide de présentation lorsque le texte est tronqué.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SectionDetailDialogProps {
  /** Titre de la section affiché dans l'en-tête du dialogue */
  title: string;
  /** Contenu complet à afficher */
  content: React.ReactNode;
  /** État d'ouverture du dialogue */
  isOpen: boolean;
  /** Callback de fermeture */
  onClose: () => void;
}

/**
 * Dialogue modal affichant le contenu complet d'une section de présentation.
 * Utilisé pour consulter les textes longs tronqués dans les slides.
 */
export const SectionDetailDialog = ({
  title,
  content,
  isOpen,
  onClose,
}: SectionDetailDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
