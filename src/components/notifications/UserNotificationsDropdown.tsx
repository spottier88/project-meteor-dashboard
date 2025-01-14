import { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Notification } from "@/types/notification";

export const UserNotificationsDropdown = () => {
  const user = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications } = useQuery({
    queryKey: ["userNotifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("notification_target_users")
        .select(`
          notification_targets (
            notification_id,
            notifications (
              id,
              title,
              content,
              type,
              publication_date,
              created_at
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const notifs = data
        .map(item => item.notification_targets?.notifications)
        .filter(Boolean) as Notification[];
      
      setUnreadCount(notifs.length);
      return notifs;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Rafraîchit toutes les 30 secondes
  });

  return (
    <DropdownMenu>
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
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 cursor-pointer">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {notification.content}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(notification.publication_date), "d MMMM yyyy", { locale: fr })}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};