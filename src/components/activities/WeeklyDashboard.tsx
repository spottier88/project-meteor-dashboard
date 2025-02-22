
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartIcon, List, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { ActivityFilters } from './ActivityFilters';
import { ActivityList } from './ActivityList';
import { ActivityChart } from './ActivityChart';
import { ActivityTypeChart } from './ActivityTypeChart';
import { ProjectTimeChart } from './ProjectTimeChart';
import { TeamActivityFilters } from './TeamActivityFilters';
import { CalendarImport } from './CalendarImport';
import { Database } from "@/integrations/supabase/types";
import { useLocation } from 'react-router-dom';
import { useActivityPeriod } from '@/hooks/useActivityPeriod';
import { useActivityData, processActivityData } from '@/hooks/useActivityData';
import { exportActivitiesToExcel } from '@/utils/activityExport';

type ActivityType = Database["public"]["Enums"]["activity_type"];

export const WeeklyDashboard = () => {
  const location = useLocation();
  const isTeamView = location.pathname === '/team-activities';
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [projectId, setProjectId] = useState('all');
  const [activityType, setActivityType] = useState<'all' | ActivityType>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const {
    period,
    setPeriod,
    getPeriodDates,
    handleNavigateBack,
    handleNavigateForward,
    getPeriodLabel,
    getDaysInPeriod,
  } = useActivityPeriod();

  const { start: periodStart, end: periodEnd } = getPeriodDates();

  const { activities, isLoading, error } = useActivityData(
    isTeamView,
    period,
    projectId,
    activityType,
    periodStart,
    periodEnd,
    selectedUserId
  );

  const { dailyActivities, chartData } = processActivityData(activities || [], periodStart, getDaysInPeriod);

  const handleExportToExcel = () => {
    exportActivitiesToExcel(activities || [], periodStart);
  };

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
            <CalendarImport />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={!hasActivities}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant={viewMode === 'chart' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              <BarChartIcon className="h-4 w-4 mr-2" />
              Graphique
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
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
                selectedUserId={isTeamView ? selectedUserId : undefined}
                setSelectedUserId={isTeamView ? setSelectedUserId : undefined}
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
