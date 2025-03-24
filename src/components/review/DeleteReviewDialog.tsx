
/**
 * @component DeleteReviewDialog
 * @description Boîte de dialogue de confirmation pour la suppression d'une revue de projet.
 * Demande confirmation avant de supprimer définitivement une revue et ses actions associées.
 * Gère l'appel à l'API de suppression et les notifications de succès ou d'erreur.
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  projectId: string;
  reviewDate: string;
  onReviewDeleted?: () => void;
}

export const DeleteReviewDialog = ({
  isOpen,
  onClose,
  reviewId,
  projectId,
  reviewDate,
  onReviewDeleted,
}: DeleteReviewDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = new Date(reviewDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Vérification de l'existence de la revue
      const { data: existingReview, error: checkError } = await supabase
        .from("reviews")
        .select("id")
        .eq("id", reviewId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!existingReview) {
        toast({
          title: "Erreur",
          description: "La revue n'existe plus ou a déjà été supprimée",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Suppression des actions liées à la revue
      const { error: actionsError } = await supabase
        .from("review_actions")
        .delete()
        .eq("review_id", reviewId);

      if (actionsError) {
        throw actionsError;
      }

      // Suppression de la revue
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression de la revue",
          variant: "destructive",
        });
        return;
      }

      // Invalider le cache des revues pour forcer un rafraîchissement
      await queryClient.invalidateQueries({ queryKey: ["reviews", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["lastReview", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Attendre un court instant pour s'assurer que la requête est bien invalidée
      await new Promise(resolve => setTimeout(resolve, 100));

      // Rafraîchir la liste des revues via le callback
      if (onReviewDeleted) {
        await onReviewDeleted();
      }

      // Fermer le dialogue
      onClose();

      // Afficher le toast de confirmation
      toast({
        title: "Succès",
        description: "La revue a été supprimée avec succès",
      });

    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va supprimer définitivement la revue du {formattedDate}.
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className={isDeleting ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
