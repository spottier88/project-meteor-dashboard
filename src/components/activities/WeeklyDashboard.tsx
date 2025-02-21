
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@supabase/auth-helpers-react';
import { format, startOfWeek, startOfMonth, startOfDay, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChartIcon, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from './ActivityFilters';
import { ActivityList } from './ActivityList';
import { ActivityChart } from './ActivityChart';
import { ActivityTypeChart } from './ActivityTypeChart';
import { ProjectTimeChart } from './ProjectTimeChart';
import { TeamActivityFilters } from './TeamActivityFilters';
import { Database } from "@/integrations/supabase/types";
import { useLocation } from 'react-router-dom';

type ActivityType = Database["public"]["Enums"]["activity_type"];

export const WeeklyDashboard = () => {
  const user = useUser();
  const location = useLocation();
  const isTeamView = location.pathname === '/team-activities';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [period, setPeriod] = useState('week');
  const [projectId, setProjectId] = useState('all');
  const [activityType, setActivityType] = useState<'all' | ActivityType>('all');

  const getPeriodDates = () => {
    switch (period) {
      case 'day':
        return { start: startOfDay(currentDate) };
      case 'month':
        return { start: startOfMonth(currentDate) };
      case 'week':
      default:
        return { start: startOfWeek(currentDate, { locale: fr }) };
    }
  };

  const handleNavigateBack = () => {
    switch (period) {
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const handleNavigateForward = () => {
    switch (period) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
    }
  };

  const { start: periodStart } = getPeriodDates();

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return format(currentDate, 'dd MMMM yyyy', { locale: fr });
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case 'week':
      default:
        const weekEnd = addDays(periodStart, 6);
        return `${format(periodStart, 'dd')} - ${format(weekEnd, 'dd MMMM yyyy', { locale: fr })}`;
    }
  };

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', isTeamView, period, projectId, activityType, periodStart.toISOString()],
    queryFn: async () => {
      console.log("[WeeklyDashboard] Fetching activities with params:", {
        isTeamView,
        period,
        projectId,
        activityType,
        startDate: periodStart.toISOString()
      });

      let query = supabase
        .from('activities')
        .select(`
          *,
          projects (title)
        `)
        .gte('start_time', periodStart.toISOString())
        .order('start_time', { ascending: true });

      if (!isTeamView) {
        query = query.eq('user_id', user?.id);
      }

      if (projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      if (activityType !== 'all') {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[WeeklyDashboard] Error fetching activities:", error);
        throw error;
      }

      console.log("[WeeklyDashboard] Fetched activities:", data);
      return data;
    },
    enabled: !!user,
  });

  const getDaysInPeriod = () => {
    switch (period) {
      case 'day':
        return 1;
      case 'month':
        return endOfMonth(currentDate).getDate();
      case 'week':
      default:
        return 7;
    }
  };

  const allDays = Array.from({ length: getDaysInPeriod() }, (_, i) => {
    const date = addDays(periodStart, i);
    return {
      date,
      day: format(date, 'EEEE', { locale: fr }),
      total: 0,
      activities: [],
    };
  });

  const dailyActivities = activities?.reduce((acc, activity) => {
    const activityDate = new Date(activity.start_time);
    const day = format(activityDate, 'EEEE', { locale: fr });
    const dayIndex = allDays.findIndex(d => d.day === day);
    
    if (dayIndex !== -1) {
      allDays[dayIndex].total += activity.duration_minutes;
      allDays[dayIndex].activities.push(activity);
    }
    
    return acc;
  }, allDays) || allDays;

  const chartData = dailyActivities.map(({ date, total }) => ({
    day: format(date, 'EEE', { locale: fr }),
    total: Math.round((total / 60) * 100) / 100,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Chargement des activités...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-destructive">Une erreur est survenue lors du chargement des activités.</p>
      </div>
    );
  }

  const hasActivities = activities && activities.length > 0;

  const Filters = isTeamView ? TeamActivityFilters : ActivityFilters;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Activités</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              <BarChartIcon className="h-4 w-4 mr-2" />
              Graphique
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex-grow">
              <Filters
                period={period}
                setPeriod={setPeriod}
                projectId={projectId}
                setProjectId={setProjectId}
                activityType={activityType}
                setActivityType={setActivityType}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateBack}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-32 text-center">{getPeriodLabel()}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateForward}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!activities || activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune activité enregistrée sur cette période
            </p>
          ) : viewMode === 'chart' ? (
            <div className="space-y-6">
              <ActivityChart data={chartData} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActivityTypeChart activities={activities} />
                <ProjectTimeChart activities={activities} />
              </div>
            </div>
          ) : (
            <ActivityList dailyActivities={dailyActivities} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

