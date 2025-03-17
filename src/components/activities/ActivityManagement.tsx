
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyDashboard } from './WeeklyDashboard';
import { ActivityEntry } from './ActivityEntry';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";

export const ActivityManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isTimeTracker } = usePermissionsContext();
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
          <h1 className="text-3xl font-bold">Mes activités</h1>
        </div>
        <ActivityEntry />
      </div>
      <WeeklyDashboard />
    </div>
  );
};
