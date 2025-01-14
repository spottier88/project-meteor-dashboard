import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationForm } from "@/components/notifications/NotificationForm";
import { NotificationList } from "@/components/notifications/NotificationList";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function NotificationManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des notifications</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle notification
        </Button>
      </div>

      <NotificationList onDelete={() => null} />

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nouvelle notification</SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <NotificationForm
              onSuccess={() => setIsFormOpen(false)}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}