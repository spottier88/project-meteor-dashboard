
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamPointsDashboard } from '@/components/activities/TeamPointsDashboard';
import { WeeklyDashboard } from '@/components/activities/WeeklyDashboard';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";

export const TeamActivities = () => {
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authorized
  if (!isAdmin && !isManager && !hasRole('chef_projet')) {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux projets
        </Button>
        <h1 className="text-3xl font-bold">Activités des équipes</h1>
      </div>

      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Points hebdomadaires
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Suivi horaire (ancien)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="points" className="space-y-6 mt-6">
          <TeamPointsDashboard />
        </TabsContent>
        
        <TabsContent value="hours" className="space-y-6 mt-6">
          <WeeklyDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
