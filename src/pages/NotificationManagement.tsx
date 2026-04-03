/**
 * @page NotificationManagement
 * @description Page d'administration des notifications avec onglets par type.
 */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router";

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

      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle notification
        </Button>
      </div>

      {/* Onglets par type de notification */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="user">Utilisateur</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <NotificationList onDelete={() => null} typeFilter="all" />
        </TabsContent>
        <TabsContent value="system">
          <NotificationList onDelete={() => null} typeFilter="system" />
        </TabsContent>
        <TabsContent value="feedback">
          <NotificationList onDelete={() => null} typeFilter="feedback" />
        </TabsContent>
        <TabsContent value="user">
          <NotificationList onDelete={() => null} typeFilter="user" />
        </TabsContent>
      </Tabs>

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
