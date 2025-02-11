
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

  const handleDelete = async () => {
    try {
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

      // D'abord, rafraîchir la liste des projets
      if (onProjectDeleted) {
        onProjectDeleted();
      }

      // Ensuite, fermer le dialogue
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
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
