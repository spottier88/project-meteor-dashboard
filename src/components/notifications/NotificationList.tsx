import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";
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

interface NotificationListProps {
  onDelete: () => void;
}

export function NotificationList({ onDelete }: NotificationListProps) {
  const { toast } = useToast();
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

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

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date de publication</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications?.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>{notification.title}</TableCell>
              <TableCell>
                {notification.type === "system" ? "Système" : "Utilisateur"}
              </TableCell>
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
                    onClick={() => setSelectedNotification(notification.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(notification.id)}
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
                  refetch();
                }}
                onCancel={() => setSelectedNotification(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}