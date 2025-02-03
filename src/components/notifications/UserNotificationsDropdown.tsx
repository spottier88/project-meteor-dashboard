import { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Notification } from "@/types/notification";
import { useToast } from "@/components/ui/use-toast";

export const UserNotificationsDropdown = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["userNotifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_notifications")
        .select(`
          notification_id,
          read_at,
          notifications (
            id,
            title,
            content,
            type,
            publication_date,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const notifs = data
        .map(item => {
          //const notification = item.notifications;
          // Accéder au premier élément du tableau notifications
        const notification = Array.isArray(item.notifications) ? 
        item.notifications[0] : item.notifications;
        if (!notification) return null;
          
          // Conversion explicite des dates en chaînes ISO
          return {
            ...notification,
            publication_date: notification.publication_date ? new Date(notification.publication_date).toISOString() : null,
            created_at: notification.created_at ? new Date(notification.created_at).toISOString() : null,
            read_at: item.read_at
          };
        })
        .filter(Boolean) as (Notification & { read_at: string | null })[];

      console.log("Raw data from Supabase:", data);
      console.log("After transformation:", notifs);

      
      setUnreadCount(notifs.length);
      return notifs;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("notification_id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["userNotifications"] });

      toast({
        title: "Notification marquée comme lue",
        description: "La notification a été supprimée de votre liste",
      });
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage de la notification",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDropdownOpen(false);
  };

  const handleCloseDialog = () => {
    setSelectedNotification(null);
  };

  const formatNotificationDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date invalide";
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <ScrollArea className="h-[300px]">
            {notifications?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              notifications?.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className="flex flex-col items-start p-4 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="w-full flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNotificationDate(notification.publication_date)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog 
        open={!!selectedNotification} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent 
          className="sm:max-w-[500px]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {selectedNotification?.content}
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Publié le {selectedNotification && formatNotificationDate(selectedNotification.publication_date)}
            </div>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </>
  );
};
