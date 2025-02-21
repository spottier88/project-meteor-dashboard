
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Chart, BarChart } from 'recharts';

export const WeeklyDashboard = () => {
  const user = useUser();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const { data: activities } = useQuery({
    queryKey: ['activities', 'weekly', startOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          projects (title)
        `)
        .eq('user_id', user?.id)
        .gte('start_time', startOfWeek.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Grouper les activités par jour
  const dailyActivities = activities?.reduce((acc: any, activity) => {
    const day = format(new Date(activity.start_time), 'EEEE', { locale: fr });
    if (!acc[day]) {
      acc[day] = {
        total: 0,
        activities: [],
      };
    }
    acc[day].total += activity.duration_minutes;
    acc[day].activities.push(activity);
    return acc;
  }, {}) || {};

  // Préparer les données pour le graphique
  const chartData = Object.entries(dailyActivities).map(([day, data]: [string, any]) => ({
    day,
    total: data.total / 60, // Convertir en heures
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activités de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full aspect-[2/1]">
            <BarChart
              data={chartData}
              width={800}
              height={300}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <Chart />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Heures" fill="#8884d8" />
            </BarChart>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(dailyActivities).map(([day, data]: [string, any]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="capitalize">{day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.activities.map((activity: any) => (
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

