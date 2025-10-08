
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyDashboard } from './WeeklyDashboard';
import { ActivityEntry } from './ActivityEntry';
import { WeeklyPointsEntry } from './WeeklyPointsEntry';
import { IndividualPointsDashboard } from './IndividualPointsDashboard';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Target, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ActivityManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isTimeTracker } = usePermissionsContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activityToDelete, setActivityToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"hours" | "points" | "dashboard">("points");

  // Vérifier si l'utilisateur peut accéder à cette page
  if (!isAdmin && !isTimeTracker) {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }

  // Fonction pour supprimer une activité
  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDelete.id);
      
      if (error) throw error;
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      toast({
        title: "Activité supprimée",
        description: "L'activité a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'activité",
        variant: "destructive",
      });
    } finally {
      setActivityToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
          <h1 className="text-3xl font-bold">Mes activités</h1>
        </div>
      </div>

      {/* Tabs pour basculer entre les modes */}
      <Tabs value={trackingMode} onValueChange={(v) => setTrackingMode(v as "hours" | "points" | "dashboard")} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Saisie points
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Suivi horaire (ancien)
          </TabsTrigger>
        </TabsList>

        {/* Mode Saisie de Points */}
        <TabsContent value="points" className="space-y-6">
          <WeeklyPointsEntry />
        </TabsContent>

        {/* Mode Dashboard Points */}
        <TabsContent value="dashboard" className="space-y-6">
          <IndividualPointsDashboard />
        </TabsContent>

        {/* Mode Heures (ancien système) */}
        <TabsContent value="hours" className="space-y-6">
          <div className="flex justify-end mb-4">
            <ActivityEntry />
          </div>
          <WeeklyDashboard 
            onDeleteActivity={setActivityToDelete}
            showDeleteButton={true}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette activité ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteActivity}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
