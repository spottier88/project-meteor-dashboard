/**
 * Dashboard équipe pour la visualisation des points hebdomadaires de l'équipe
 * Accessible aux managers, chefs de projet et administrateurs
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Users } from "lucide-react";
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PointsChart } from './PointsChart';
import { ProjectPointsChart } from './ProjectPointsChart';
import { ActivityTypePointsChart } from './ActivityTypePointsChart';
import { useWeeklyPointsData, processWeeklyPointsData } from '@/hooks/useWeeklyPointsData';
import { exportTeamWeeklyPointsToExcel, exportUserPointsStats } from '@/utils/weeklyPointsExport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const TeamPointsDashboard = () => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [projectId, setProjectId] = useState<string>('all');
  const [activityType, setActivityType] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const { data: points, isLoading } = useWeeklyPointsData({
    isTeamView: true,
    weekStartDate: currentWeek,
    projectId,
    activityType,
    selectedUserId
  });

  const chartData = processWeeklyPointsData(points || [], currentWeek);

  // Récupérer les utilisateurs de l'équipe
  const { data: teamUsers } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_team_view_users', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      return data || [];
    }
  });

  // Récupérer les projets accessibles
  const { data: projects } = useQuery({
    queryKey: ['team-projects'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_team_view_projects', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      return data || [];
    }
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

  // Calculer les statistiques d'équipe
  const totalTeamPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;
  const uniqueUsers = new Set(points?.map(p => p.user_id)).size;

  const handleExportToExcel = () => {
    if (!points || points.length === 0) return;
    exportTeamWeeklyPointsToExcel(points, currentWeek);
  };

  const handleExportStats = () => {
    if (!points || points.length === 0) return;
    exportUserPointsStats(points, currentWeek);
  };

  if (isLoading) {
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
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Tableau de bord de l'équipe</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportStats} disabled={!points || points.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Stats utilisateurs
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={!points || points.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation et filtres */}
          <div className="flex flex-col gap-4 mb-6">
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
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {teamUsers?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects?.map((project: any) => (
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

          {/* Statistiques d'équipe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalTeamPoints}</div>
                <p className="text-xs text-muted-foreground">Points totaux de l'équipe</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{uniqueUsers}</div>
                <p className="text-xs text-muted-foreground">Contributeurs actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {uniqueUsers > 0 ? Math.round(totalTeamPoints / uniqueUsers) : 0}
                </div>
                <p className="text-xs text-muted-foreground">Points moyens par personne</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          {!points || points.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun point enregistré sur cette période pour les filtres sélectionnés
            </p>
          ) : (
            <div className="space-y-6">
              <PointsChart data={chartData} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActivityTypePointsChart points={points} />
                <ProjectPointsChart points={points} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
