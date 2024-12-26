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

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onProjectDeleted: () => void;
}

export const DeleteProjectDialog = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onProjectDeleted,
}: DeleteProjectDialogProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
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

    toast({
      title: "Succès",
      description: "Le projet a été supprimé avec succès",
    });
    onProjectDeleted();
    onClose();
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