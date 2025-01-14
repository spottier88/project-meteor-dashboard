import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationForm } from "@/components/notifications/NotificationForm";
import { NotificationList } from "@/components/notifications/NotificationList";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

export function NotificationManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold">Gestion des notifications</h1>
      </div>

      <div className="flex justify-end mb-8">
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