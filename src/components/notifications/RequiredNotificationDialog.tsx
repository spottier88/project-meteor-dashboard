
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/notification";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "@/utils/logger";

export function RequiredNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requiredNotifications, isLoading } = useQuery({
    queryKey: ["requiredNotifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch user notifications that haven't been read yet
      const { data: userNotifications, error: userError } = await supabase
        .from("user_notifications")
        .select("notification_id, read_at")
        .eq("user_id", user.id)
        .is("read_at", null);

      if (userError) throw userError;
      
      if (!userNotifications.length) return [];
      
      // Use those notification IDs to fetch the actual required notifications
      const notificationIds = userNotifications.map(un => un.notification_id);
      
      const { data: notifications, error: notifError } = await supabase
        .from("notifications")
        .select("*")
        .in("id", notificationIds)
        .eq("required", true)
        .eq("published", true)
        .lte("publication_date", new Date().toISOString());
        
      if (notifError) throw notifError;
      
      return notifications as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Ouvrir le dialogue si des notifications obligatoires sont trouvées
  useEffect(() => {
    if (requiredNotifications && requiredNotifications.length > 0) {
      logger.info(`Affichage de ${requiredNotifications.length} notification(s) obligatoire(s)`, "notifications");
      setOpen(true);
    }
  }, [requiredNotifications]);

  const markAsRead = async () => {
    try {
      if (!user?.id || !requiredNotifications) return;
      
      const notification = requiredNotifications[currentNotificationIndex];
      logger.debug(`Marquage de la notification ${notification.id} comme lue`, "notifications");
      
      const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("notification_id", notification.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Passez à la notification suivante ou fermez si c'était la dernière
      if (currentNotificationIndex < requiredNotifications.length - 1) {
        logger.debug("Passage à la notification suivante", "notifications");
        setCurrentNotificationIndex(prev => prev + 1);
      } else {
        logger.debug("Toutes les notifications ont été lues", "notifications");
        setOpen(false);
        setCurrentNotificationIndex(0);
        await queryClient.invalidateQueries({ queryKey: ["requiredNotifications"] });
        await queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
      }

      toast({
        title: "Notification marquée comme lue",
        description: "Vous avez bien pris connaissance de cette notification"
      });
    } catch (error) {
      logger.error(`Erreur lors du marquage de la notification: ${error}`, "notifications");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la notification",
        variant: "destructive",
      });
    }
  };

  // Si aucune notification ou en cours de chargement
  if (isLoading || !requiredNotifications || requiredNotifications.length === 0) {
    return null;
  }

  const currentNotification = requiredNotifications[currentNotificationIndex];
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      // Empêcher la fermeture du dialogue en cliquant en dehors
      if (!value) return;
      setOpen(value);
    }}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{currentNotification.title}</DialogTitle>
          <DialogDescription>
            {currentNotificationIndex + 1} sur {requiredNotifications.length} notification{requiredNotifications.length > 1 ? 's' : ''} obligatoire{requiredNotifications.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {currentNotification.content}
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Publié le {format(new Date(currentNotification.publication_date), "d MMMM yyyy", { locale: fr })}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={markAsRead}>
            Marquer comme lu{requiredNotifications.length > 1 && currentNotificationIndex < requiredNotifications.length - 1 ? ' et passer à la suivante' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
