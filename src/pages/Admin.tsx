
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { UserManagement } from "./UserManagement";
import { OrganizationManagement } from "./OrganizationManagement";
import { NotificationManagement } from "./NotificationManagement";
import { AIPromptManagement } from "./AIPromptManagement";
import { GeneralSettings } from "@/components/admin/GeneralSettings";
import { UserInfo } from "@/components/UserInfo";
import { ActivityTypeManagement } from "@/components/activities/ActivityTypeManagement"; // Fixed import path

const Admin = () => {
  const { isAdmin } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Rediriger les utilisateurs non-admin
  if (!isAdmin) {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <UserInfo />
      
      <h1 className="text-3xl font-bold mb-6">Administration</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="organization">Organisation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="activities">Types d'activités</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="organization">
          <OrganizationManagement />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationManagement />
        </TabsContent>
        
        <TabsContent value="ai">
          <AIPromptManagement />
        </TabsContent>
        
        <TabsContent value="activities">
          <ActivityTypeManagement />
        </TabsContent>
        
        <TabsContent value="settings">
          <GeneralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
