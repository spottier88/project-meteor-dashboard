
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus, PlusCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityManagement } from "@/components/activities/ActivityManagement";
import { ActivityTypeForm } from "@/components/activities/ActivityTypeForm";
import QuickActivityForm from "@/components/activities/QuickActivityForm"; // Fixed import
import { CalendarImport } from "@/components/activities/CalendarImport";
import { ActivityChart } from '@/components/activities/ActivityChart';
import { ActivityTypeChart } from '@/components/activities/ActivityTypeChart';
import { ProjectTimeChart } from '@/components/activities/ProjectTimeChart';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Activities = () => {
  const user = useUser();
  const navigate = useNavigate();
  
  const [isQuickActivityOpen, setIsQuickActivityOpen] = useState(false);
  const [isCalendarImportOpen, setIsCalendarImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('list');

  // Fetch activities for charts
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['user-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, projects:project_id(title)')
        .eq('user_id', user?.id || '');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Generate chart data from activities
  const chartData = React.useMemo(() => {
    if (!activities) return [];
    
    // Process activities for daily chart
    const dailyData: Record<string, Record<string, number>> = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.start_time).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {};
      }
      
      if (!dailyData[date][activity.activity_type]) {
        dailyData[date][activity.activity_type] = 0;
      }
      
      dailyData[date][activity.activity_type] += activity.duration_minutes / 60; // Convert to hours
    });
    
    return Object.entries(dailyData).map(([day, types]) => ({
      day,
      ...types
    }));
  }, [activities]);

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
        
        {/* Fixed props for IndividualActivityHeader */}
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-bold">Mes activités</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsCalendarImportOpen(true)}>
              Importer du calendrier
            </Button>
            <Button size="sm" onClick={() => setIsQuickActivityOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une activité
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="activities" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="activities">Mes activités</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="activities" className="mt-6">
          <ActivityManagement />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Temps par jour</h3>
                <div className="h-[300px]">
                  {/* Fixed ActivityChart props */}
                  <ActivityChart data={chartData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Temps par type d'activité</h3>
                <div className="h-[300px]">
                  {/* Fixed ActivityTypeChart props */}
                  <ActivityTypeChart activities={activities || []} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="xl:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Temps par projet</h3>
                <div className="h-[300px]">
                  {/* Fixed ProjectTimeChart props */}
                  <ProjectTimeChart activities={activities || []} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialogue pour ajouter rapidement une activité */}
      <Dialog open={isQuickActivityOpen} onOpenChange={setIsQuickActivityOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une activité</DialogTitle>
          </DialogHeader>
          <QuickActivityForm onSuccess={() => setIsQuickActivityOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Dialogue pour l'import du calendrier */}
      <Dialog open={isCalendarImportOpen} onOpenChange={setIsCalendarImportOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Importer des événements de calendrier</DialogTitle>
          </DialogHeader>
          {/* Removed onClose prop since it's not in the interface */}
          <CalendarImport />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Activities;
