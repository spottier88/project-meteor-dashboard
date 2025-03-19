
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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

interface NotificationListProps {
  onDelete: () => void;
}

export function NotificationList({ onDelete }: NotificationListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<Notification | null>(null);
  const [feedbackToRespond, setFeedbackToRespond] = useState<Notification | null>(null);

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
      return data as (Notification & { profiles: { email: string } | null })[];
    },
  });

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

  const getNotificationType = (type: string) => {
    switch (type) {
      case "system":
        return "Système";
      case "user":
        return "Utilisateur";
      case "feedback":
        return "Retour utilisateur";
      default:
        return type;
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

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
          {notifications?.map((notification) => (
            <TableRow 
              key={notification.id}
              onClick={() => setSelectedContent(notification)}
            >
              <TableCell>{notification.title}</TableCell>
              <TableCell>{getNotificationType(notification.type)}</TableCell>
              <TableCell>{notification.profiles?.email || "Système"}</TableCell>
              <TableCell>
                {format(new Date(notification.publication_date), "Pp", {
                  locale: fr,
                })}
              </TableCell>
              <TableCell>
                {notification.published ? "Publiée" : "Non publiée"}
              </TableCell>
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
                {notification.type === "feedback" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFeedbackToRespond(notification);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
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
          ))}
        </TableBody>
      </Table>

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
                <p className="whitespace-pre-wrap">{selectedContent.content}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Informations :</h3>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Type : </span>
                    {getNotificationType(selectedContent.type)}
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
                    {selectedContent.published ? "Publiée" : "Non publiée"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
    </>
  );
}
