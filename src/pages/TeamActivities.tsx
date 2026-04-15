/**
 * Page unifiée de suivi des activités d'équipe (manager/admin)
 * Vue consolidée : KPIs, filtres, graphiques, export
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Users } from "lucide-react";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActivityTypeDistributionChart } from '@/components/activities/ActivityTypeDistributionChart';
import { WeeklyTrendChart } from '@/components/activities/WeeklyTrendChart';
import { ProjectPointsChart } from '@/components/activities/ProjectPointsChart';
import { ActivityTypePointsChart } from '@/components/activities/ActivityTypePointsChart';
import { PointsVisualization } from '@/components/activities/PointsVisualization';
import { useWeeklyPointsData } from '@/hooks/useWeeklyPointsData';
import { useWeeklyTrend, processWeeklyTrendData } from '@/hooks/useWeeklyTrend';
import { exportTeamWeeklyPointsToExcel, exportUserPointsStats } from '@/utils/weeklyPointsExport';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const TeamActivities = () => {
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [projectId, setProjectId] = useState<string>('all');
  const [activityType, setActivityType] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Vérification des droits
  if (!isAdmin && !isManager && !hasRole('chef_projet')) {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }

  // Données de points
  const { data: points, isLoading } = useWeeklyPointsData({
    isTeamView: true,
    weekStartDate: currentWeek,
    projectId,
    activityType,
    selectedUserId
  });

  const { data: trendData, isLoading: isLoadingTrend } = useWeeklyTrend({
    isTeamView: true,
    weekStartDate: currentWeek,
    projectId,
    activityType,
    selectedUserId,
    weeksCount: 6
  });

  const trendChartData = processWeeklyTrendData(trendData || [], 6, currentWeek);

  // Utilisateurs de l'équipe
  const { data: teamUsers } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { data } = await supabase.rpc('get_team_view_users', { p_user_id: user.id });
      return data || [];
    }
  });

  // Projets accessibles
  const { data: projects } = useQuery({
    queryKey: ['team-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { data } = await supabase.rpc('get_team_view_projects', { p_user_id: user.id });
      return data || [];
    }
  });

  // Types d'activités
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

  // Navigation
  const handlePreviousWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const handleCurrentWeek = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getWeekLabel = () => {
    const weekEnd = addWeeks(currentWeek, 1);
    return `${format(currentWeek, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
  };

  // KPIs
  const totalTeamPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;
  const uniqueUsers = new Set(points?.map(p => p.user_id)).size;

  // Export
  const handleExportToExcel = () => {
    if (!points || points.length === 0) return;
    exportTeamWeeklyPointsToExcel(points, currentWeek);
  };

  const handleExportStats = () => {
    if (!points || points.length === 0) return;
    exportUserPointsStats(points, currentWeek);
  };

  if (isLoading || isLoadingTrend) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => void navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" />
            Activités des équipes
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStats} disabled={!points || points.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Stats utilisateurs
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={!points || points.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Navigation semaine + Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
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

            <div className="flex gap-2 flex-wrap">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {teamUsers?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
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
                  {projects?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {activityTypes?.map(t => (
                    <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              <PointsVisualization points={totalTeamPoints} size="lg" />
            </div>
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
              <PointsVisualization points={uniqueUsers > 0 ? Math.round(totalTeamPoints / uniqueUsers) : 0} size="lg" />
            </div>
            <p className="text-xs text-muted-foreground">Points moyens par personne</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Card>
        <CardContent className="pt-6">
          {!points || points.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun point enregistré sur cette période pour les filtres sélectionnés
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Répartition des points</h3>
                <ActivityTypeDistributionChart data={points} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Évolution sur 6 semaines</h3>
                <WeeklyTrendChart data={trendChartData} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Par type d'activité</h3>
                  <ActivityTypePointsChart points={points} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Par projet</h3>
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
