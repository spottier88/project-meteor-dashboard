/**
 * @component ReactivateProjectButton
 * @description Bouton pour réactiver un projet clôturé
 * Visible uniquement pour les chefs de projet et administrateurs
 * Affiche une confirmation avant de procéder
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReactivateProjectButtonProps {
  projectId: string;
  onReactivated?: () => void;
}

export const ReactivateProjectButton = ({
  projectId,
  onReactivated,
}: ReactivateProjectButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReactivating, setIsReactivating] = useState(false);

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ 
          lifecycle_status: "in_progress",
          closure_status: null,
          closed_at: null,
          closed_by: null
        })
        .eq("id", projectId);

      if (error) throw error;

      // Invalider les caches pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: "Projet réactivé",
        description: "Le projet est de nouveau en cours. Les modifications sont à nouveau possibles.",
      });

      onReactivated?.();
    } catch (error) {
      console.error("Erreur lors de la réactivation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réactiver le projet.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isReactivating}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réactiver le projet
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réactiver ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le projet passera au statut "En cours" et toutes les modifications
            seront à nouveau possibles (tâches, risques, notes, équipe).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleReactivate} disabled={isReactivating}>
            {isReactivating ? "Réactivation..." : "Réactiver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
