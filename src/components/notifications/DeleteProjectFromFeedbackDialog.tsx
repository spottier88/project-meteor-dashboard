/**
 * @component DeleteProjectFromFeedbackDialog
 * @description Modale de suppression de projet(s) à partir d'un feedback de type suppression.
 * Parse le contenu du feedback pour extraire les IDs de projets, puis propose leur suppression
 * un par un. À la fermeture, envoie automatiquement une réponse groupée au demandeur
 * listant les projets supprimés.
 */

import { useState, useMemo, useRef } from "react";
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
import { Notification } from "@/types/notification";
import { useUser } from "@/contexts/AuthContext";

interface DeleteProjectFromFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Feedback complet (notification) contenant les IDs de projets */
  feedback: Notification | null;
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
  feedback,
}: DeleteProjectFromFeedbackDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  /** Noms des projets supprimés, pour la réponse automatique */
  const deletedTitlesRef = useRef<string[]>([]);

  const feedbackContent = feedback?.content ?? "";
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

  /**
   * Envoyer une réponse automatique groupée au demandeur du feedback.
   * Réutilise la même logique que FeedbackResponseForm.
   */
  const sendAutoResponse = async (deletedProjectTitles: string[]) => {
    if (!feedback?.created_by || !user || deletedProjectTitles.length === 0) return;

    try {
      const responseTitle = `Réponse à votre demande: ${feedback.title}`;
      const responseContent = `Votre demande de suppression a été traitée.\n\nLes projets suivants ont été supprimés :\n- ${deletedProjectTitles.join("\n- ")}`;

      // 1. Créer la notification de réponse
      const { data: notificationData, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          title: responseTitle,
          content: responseContent,
          type: "user",
          publication_date: new Date().toISOString(),
          published: true,
          created_by: user.id,
          required: false,
        })
        .select("id")
        .single();

      if (notificationError) throw notificationError;

      // 2. Créer une cible de notification spécifique
      const { data: targetData, error: targetError } = await supabase
        .from("notification_targets")
        .insert({
          notification_id: notificationData.id,
          target_type: "specific",
        })
        .select("id")
        .single();

      if (targetError) throw targetError;

      // 3. Associer cette cible à l'utilisateur demandeur
      const { error: targetUserError } = await supabase
        .from("notification_target_users")
        .insert({
          notification_target_id: targetData.id,
          user_id: feedback.created_by,
        });

      if (targetUserError) throw targetUserError;

      // 4. Créer l'entrée user_notifications pour que l'utilisateur voie la réponse
      const { error: userNotificationError } = await supabase
        .from("user_notifications")
        .insert({
          notification_id: notificationData.id,
          user_id: feedback.created_by,
          read_at: null,
        });

      if (userNotificationError) throw userNotificationError;

      // Rafraîchir les notifications
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse automatique:", error);
      toast({
        title: "Avertissement",
        description: "Les projets ont été supprimés mais la réponse automatique au feedback n'a pas pu être envoyée.",
        variant: "destructive",
      });
    }
  };

  /** Supprimer un projet */
  const handleDeleteProject = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      // Trouver le titre du projet pour la réponse automatique
      const projectTitle = projects?.find((p) => p.id === projectId)?.title ?? projectId;

      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;

      setDeletedIds((prev) => new Set(prev).add(projectId));
      deletedTitlesRef.current.push(projectTitle);

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

  /** Fermeture du dialogue : envoi de la réponse automatique groupée si nécessaire */
  const handleClose = async () => {
    if (deletedTitlesRef.current.length > 0) {
      await sendAutoResponse(deletedTitlesRef.current);
    }
    // Réinitialiser les états
    setDeletedIds(new Set());
    deletedTitlesRef.current = [];
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
