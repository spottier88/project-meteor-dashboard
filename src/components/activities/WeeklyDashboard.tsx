
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@supabase/auth-helpers-react';
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export const WeeklyDashboard = () => {
  const user = useUser();
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: fr });

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', 'weekly', weekStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          projects (title)
        `)
        .eq('user_id', user?.id)
        .gte('start_time', weekStart.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Créer un tableau avec tous les jours de la semaine
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      day: format(date, 'EEEE', { locale: fr }),
      total: 0,
      activities: [],
    };
  });

  // Grouper les activités par jour
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

  // Préparer les données pour le graphique
  const chartData = dailyActivities.map(({ day, total }) => ({
    day: format(new Date(day), 'EEE', { locale: fr }),
    total: Math.round((total / 60) * 100) / 100, // Convertir en heures avec 2 décimales
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activités de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasActivities ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune activité enregistrée cette semaine
            </p>
          ) : (
            <div className="w-full aspect-[2/1]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                >
                  <XAxis 
                    dataKey="day" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}h`}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}h`, 'Heures']}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="total" 
                    name="Heures" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dailyActivities.map(({ day, activities: dayActivities, total }) => (
          <Card key={day} className={dayActivities.length === 0 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="capitalize flex justify-between items-center">
                <span>{format(new Date(day), 'EEEE', { locale: fr })}</span>
                {total > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {Math.round((total / 60) * 100) / 100}h
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Aucune activité
                </p>
              ) : (
                <div className="space-y-2">
                  {dayActivities.map((activity: any) => (
                    <div key={activity.id} className="flex justify-between items-start border-b py-2">
                      <div>
                        <p className="font-medium">{activity.projects?.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {activity.activity_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activity.start_time), 'HH:mm')}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {activity.duration_minutes}min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
