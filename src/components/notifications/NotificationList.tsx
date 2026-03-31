/**
 * @component NotificationList
 * @description Liste des notifications avec badges visuels, filtre par type,
 * et affichage en cartes pour les feedbacks avec lien question/réponse.
 * Intègre les actions contextuelles : suppression de projet, création de tâche.
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/notification";
import { PublishNotificationForm } from "./PublishNotificationForm";
import { FeedbackResponseForm } from "./FeedbackResponseForm";
import { FeedbackCard, getFeedbackSubType } from "./FeedbackCard";
import { CreateTaskFromFeedbackDialog } from "./CreateTaskFromFeedbackDialog";
import { DeleteProjectFromFeedbackDialog } from "./DeleteProjectFromFeedbackDialog";

type NotificationWithProfile = Notification & { profiles: { email: string } | null };

interface NotificationListProps {
  onDelete: () => void;
  /** Filtre par type de notification */
  typeFilter?: "all" | "system" | "feedback" | "user";
}

export function NotificationList({ onDelete, typeFilter = "all" }: NotificationListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<NotificationWithProfile | null>(null);
  const [feedbackToRespond, setFeedbackToRespond] = useState<NotificationWithProfile | null>(null);

  // État pour les actions contextuelles
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState<{ title: string; description: string }>({ title: "", description: "" });
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [deleteProjectContent, setDeleteProjectContent] = useState("");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          profiles:created_by (
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NotificationWithProfile[];
    },
  });

  /** Filtrer les notifications selon le type sélectionné */
  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (typeFilter === "all") return notifications;
    if (typeFilter === "feedback") {
      // Inclure les feedbacks ET les réponses associées (type user avec titre "Réponse à votre demande:")
      return notifications.filter(
        (n) => n.type === "feedback"
      );
    }
    if (typeFilter === "user") {
      // Exclure les réponses aux feedbacks de l'onglet utilisateur
      return notifications.filter(
        (n) => n.type === "user" && !n.title.startsWith("Réponse à votre demande:")
      );
    }
    return notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  /**
   * Pour l'onglet feedback : associer chaque feedback à sa réponse éventuelle.
   * La réponse est une notification de type "user" dont le titre est "Réponse à votre demande: {titre du feedback}"
   */
  const feedbacksWithResponses = useMemo(() => {
    if (typeFilter !== "feedback" || !notifications) return [];

    const feedbacks = notifications.filter((n) => n.type === "feedback");
    const responses = notifications.filter(
      (n) => n.type === "user" && n.title.startsWith("Réponse à votre demande:")
    );

    return feedbacks.map((fb) => {
      const expectedTitle = `Réponse à votre demande: ${fb.title}`;
      const matchedResponse = responses.find((r) => r.title === expectedTitle) || null;
      return { feedback: fb, response: matchedResponse };
    });
  }, [notifications, typeFilter]);

  /** Suppression d'une notification */
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès",
      });

      onDelete();
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la notification",
        variant: "destructive",
      });
    }
  };

  /** Badge coloré selon le type */
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "system":
        return <Badge variant="blue">Système</Badge>;
      case "user":
        return <Badge variant="default">Utilisateur</Badge>;
      case "feedback":
        return <Badge variant="warning">Feedback</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  /** Badge de statut de publication */
  const getStatusBadge = (published: boolean | null) => {
    return published ? (
      <Badge variant="default">Publiée</Badge>
    ) : (
      <Badge variant="secondary">Non publiée</Badge>
    );
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  // Affichage en cartes pour l'onglet Feedback
  if (typeFilter === "feedback") {
    return (
      <>
        {feedbacksWithResponses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun feedback pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedbacksWithResponses.map(({ feedback, response }) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                response={response}
                onViewDetail={setSelectedContent}
                onRespond={setFeedbackToRespond}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Sheets communes */}
        {renderDetailSheet()}
        {renderPublishSheet()}
        {renderFeedbackResponseSheet()}
      </>
    );
  }

  // Affichage en tableau pour les autres onglets
  return (
    <>
      <Table className="cursor-pointer">
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Créé par</TableHead>
            <TableHead>Date de publication</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNotifications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucune notification.
              </TableCell>
            </TableRow>
          ) : (
            filteredNotifications.map((notification) => (
              <TableRow
                key={notification.id}
                onClick={() => setSelectedContent(notification)}
              >
                <TableCell>{notification.title}</TableCell>
                <TableCell>{getTypeBadge(notification.type)}</TableCell>
                <TableCell>{notification.profiles?.email || "Système"}</TableCell>
                <TableCell>
                  {format(new Date(notification.publication_date), "Pp", {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell>{getStatusBadge(notification.published)}</TableCell>
                <TableCell className="space-x-2">
                  {!notification.published && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotification(notification.id);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {renderDetailSheet()}
      {renderPublishSheet()}
      {renderFeedbackResponseSheet()}
    </>
  );

  /** Sheet de détail d'une notification */
  function renderDetailSheet() {
    return (
      <Sheet
        open={!!selectedContent}
        onOpenChange={() => setSelectedContent(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedContent?.title}</SheetTitle>
          </SheetHeader>
          {selectedContent && (
            <div className="mt-8 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contenu :</h3>
                <div className="max-h-[50vh] overflow-y-auto">
                  <p className="whitespace-pre-wrap">{selectedContent.content}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Informations :</h3>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Type : </span>
                    {getTypeBadge(selectedContent.type)}
                  </li>
                  <li>
                    <span className="font-medium">Créé par : </span>
                    {selectedContent.profiles?.email || "Système"}
                  </li>
                  <li>
                    <span className="font-medium">Date de publication : </span>
                    {format(new Date(selectedContent.publication_date), "Pp", {
                      locale: fr,
                    })}
                  </li>
                  <li>
                    <span className="font-medium">Statut : </span>
                    {getStatusBadge(selectedContent.published)}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  /** Sheet de publication */
  function renderPublishSheet() {
    return (
      <Sheet
        open={!!selectedNotification}
        onOpenChange={() => setSelectedNotification(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Publier la notification</SheetTitle>
          </SheetHeader>
          {selectedNotification && (
            <div className="mt-8">
              <PublishNotificationForm
                notificationId={selectedNotification}
                onSuccess={() => {
                  setSelectedNotification(null);
                  queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }}
                onCancel={() => setSelectedNotification(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  /** Sheet de réponse au feedback */
  function renderFeedbackResponseSheet() {
    return (
      <Sheet
        open={!!feedbackToRespond}
        onOpenChange={() => setFeedbackToRespond(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Répondre au feedback</SheetTitle>
          </SheetHeader>
          {feedbackToRespond && (
            <div className="mt-8">
              <FeedbackResponseForm
                feedback={feedbackToRespond}
                onSuccess={() => {
                  setFeedbackToRespond(null);
                  queryClient.invalidateQueries({ queryKey: ["notifications"] });
                  toast({
                    title: "Réponse envoyée",
                    description: "Votre réponse a été envoyée avec succès",
                  });
                }}
                onCancel={() => setFeedbackToRespond(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }
}
