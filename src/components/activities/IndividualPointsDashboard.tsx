/**
 * Dashboard individuel pour la visualisation des points hebdomadaires d'un utilisateur
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActivityTypeDistributionChart } from "./ActivityTypeDistributionChart";
import { WeeklyTrendChart } from "./WeeklyTrendChart";
import { ProjectPointsChart } from './ProjectPointsChart';
import { ActivityTypePointsChart } from './ActivityTypePointsChart';
import { WeeklyPointsDistribution } from './WeeklyPointsDistribution';
import { useWeeklyPointsData } from '@/hooks/useWeeklyPointsData';
import { useWeeklyTrend, processWeeklyTrendData } from "@/hooks/useWeeklyTrend";
import { useWeeklyPointsTotal } from '@/hooks/useWeeklyPoints';
import { useUser } from '@supabase/auth-helpers-react';
import { exportWeeklyPointsToExcel } from '@/utils/weeklyPointsExport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const IndividualPointsDashboard = () => {
  const user = useUser();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [projectId, setProjectId] = useState<string>('all');
  const [activityType, setActivityType] = useState<string>('all');

  const { data: points, isLoading } = useWeeklyPointsData({
    isTeamView: false,
    weekStartDate: currentWeek,
    projectId,
    activityType,
    selectedUserId: user?.id || ''
  });

  // Récupérer les données de tendance sur 6 semaines
  const { data: trendData, isLoading: isLoadingTrend } = useWeeklyTrend({
    isTeamView: false,
    weekStartDate: currentWeek,
    projectId,
    activityType,
    selectedUserId: '',
    weeksCount: 6
  });

  const { data: totalPoints } = useWeeklyPointsTotal(user?.id || '', currentWeek);
  const trendChartData = processWeeklyTrendData(trendData || [], 6, currentWeek);

  // Récupérer les projets de l'utilisateur
  const { data: projects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('projects')
        .select('id, title')
        .or(`project_manager_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('title');
      return data || [];
    },
    enabled: !!user
  });

  // Récupérer les types d'activités
  const { data: activityTypes } = useQuery({
    queryKey: ['activity-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    }
  });

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getWeekLabel = () => {
    const weekEnd = addWeeks(currentWeek, 1);
    return `${format(currentWeek, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
  };

  const handleExportToExcel = () => {
    if (!points || points.length === 0) return;
    
    const userName = user ? `${user.email}` : undefined;
    exportWeeklyPointsToExcel(points, currentWeek, userName);
  };

  if (isLoading || isLoadingTrend) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Mon tableau de bord hebdomadaire</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={!points || points.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation de semaine */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-48 text-center font-medium">{getWeekLabel()}</span>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
                Aujourd'hui
              </Button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 flex-1">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {activityTypes?.map(type => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Distribution des points */}
          <WeeklyPointsDistribution 
            totalPointsUsed={totalPoints || 0}
            weekStartDate={currentWeek}
          />

          {/* Graphiques */}
          {!points || points.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun point enregistré sur cette période
            </p>
          ) : (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Répartition des points de la semaine</h3>
                <ActivityTypeDistributionChart data={points} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Évolution sur 6 semaines</h3>
                <WeeklyTrendChart data={trendChartData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Détails par type d'activité</h3>
                  <ActivityTypePointsChart points={points} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Détails par projet</h3>
                  <ProjectPointsChart points={points} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
