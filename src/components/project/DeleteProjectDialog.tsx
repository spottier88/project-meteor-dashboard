
/**
 * @component DeleteProjectDialog
 * @description Boîte de dialogue de confirmation pour la suppression d'un projet.
 * Demande confirmation avant de supprimer définitivement un projet et ses données associées.
 * Gère l'appel à l'API de suppression et les notifications de succès ou d'erreur.
 */

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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onProjectDeleted?: () => void;
}

export const DeleteProjectDialog = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onProjectDeleted,
}: DeleteProjectDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Vérifions d'abord si le projet existe
      const { data: existingProject, error: checkError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!existingProject) {
        toast({
          title: "Erreur",
          description: "Le projet n'existe plus ou a déjà été supprimé",
          variant: "destructive",
        });
        onClose();
        return;
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du projet",
          variant: "destructive",
        });
        return;
      }

      // Invalider le cache des projets pour forcer un rafraîchissement
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Attendre un court instant pour s'assurer que la requête est bien invalidée
      await new Promise(resolve => setTimeout(resolve, 100));

      // Rafraîchir la liste des projets via le callback
      if (onProjectDeleted) {
        await onProjectDeleted();
      }

      // Fermer le dialogue
      onClose();

      // Afficher le toast de confirmation
      toast({
        title: "Succès",
        description: "Le projet a été supprimé avec succès",
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
            Cette action va supprimer définitivement le projet "{projectTitle}".
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }} 
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
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
