
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WeeklyDashboard } from '@/components/activities/WeeklyDashboard';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";

export const TeamActivities = () => {
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const user = useUser();
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
      <div className="flex items-center justify-between">
        <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux projets
      </Button>
      </div>

      <WeeklyDashboard />
    </div>
  );
};

