import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/notification";

interface NotificationListProps {
  onDelete: () => void;
}

export function NotificationList({ onDelete }: NotificationListProps) {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery({
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date de publication</TableHead>
          <TableHead>Date de création</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
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
              {format(new Date(notification.created_at), "Pp", {
                locale: fr,
              })}
            </TableCell>
            <TableCell>
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
  );
}