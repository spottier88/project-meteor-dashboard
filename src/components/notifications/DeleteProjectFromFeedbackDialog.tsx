/**
 * @component DeleteProjectFromFeedbackDialog
 * @description Modale de suppression de projet(s) à partir d'un feedback de type suppression.
 * Parse le contenu du feedback pour extraire les IDs de projets, puis propose leur suppression
 * un par un via le DeleteProjectDialog existant.
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteProjectFromFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Contenu brut du feedback */
  feedbackContent: string;
}

/**
 * Parse les IDs de projets depuis le contenu du feedback.
 * Format attendu : première ligne "project_ids:uuid1,uuid2"
 */
function parseProjectIds(content: string): string[] {
  const match = content.match(/^project_ids:(.+)$/m);
  if (match) {
    return match[1].split(",").map((id) => id.trim()).filter(Boolean);
  }
  return [];
}

export function DeleteProjectFromFeedbackDialog({
  open,
  onOpenChange,
  feedbackContent,
}: DeleteProjectFromFeedbackDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const projectIds = useMemo(() => parseProjectIds(feedbackContent), [feedbackContent]);

  /** Récupérer les projets correspondants aux IDs */
  const { data: projects } = useQuery({
    queryKey: ["projects-for-deletion", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);
      if (error) throw error;
      return data;
    },
    enabled: open && projectIds.length > 0,
  });

  /** Supprimer un projet */
  const handleDeleteProject = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;

      setDeletedIds((prev) => new Set(prev).add(projectId));
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression projet:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    setDeletedIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer les projets demandés</DialogTitle>
        </DialogHeader>

        {projectIds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Aucun identifiant de projet trouvé dans ce feedback. Les feedbacks de suppression
            créés avant cette mise à jour ne contiennent pas les IDs nécessaires.
          </p>
        ) : !projects || projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Les projets mentionnés n'existent plus ou ont déjà été supprimés.
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const isDeleted = deletedIds.has(project.id);
              const isDeleting = deletingId === project.id;
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {isDeleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    <span className={isDeleted ? "line-through text-muted-foreground" : ""}>
                      {project.title}
                    </span>
                  </div>
                  {!isDeleted && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </Button>
                  )}
                  {isDeleted && (
                    <Badge variant="default">Supprimé</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={handleClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
