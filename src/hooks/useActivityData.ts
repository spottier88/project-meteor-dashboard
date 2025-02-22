
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from '@supabase/auth-helpers-react';
import { Database } from "@/integrations/supabase/types";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

type ActivityType = Database["public"]["Enums"]["activity_type"];

interface Activity {
  start_time: string;
  duration_minutes: number;
  activity_type: ActivityType;
  description?: string;
  id: string;
  projects: {
    title: string;
  };
}

interface DayActivity {
  date: Date;
  day: string;
  total: number;
  activities: Activity[];
  byType: Record<ActivityType, number>;
}

export const useActivityData = (
  isTeamView: boolean,
  period: string,
  projectId: string,
  activityType: 'all' | ActivityType,
  periodStart: Date,
  periodEnd: Date,
  selectedUserId: string
) => {
  const user = useUser();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', isTeamView, period, projectId, activityType, periodStart.toISOString(), selectedUserId],
    queryFn: async () => {
      console.log("[useActivityData] Fetching activities with params:", {
        isTeamView,
        period,
        projectId,
        activityType,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        selectedUserId
      });

      let query = supabase
        .from('activities')
        .select(`
          *,
          projects!inner (
            title,
            project_manager_id,
            profiles!projects_project_manager_id_fkey (
              first_name,
              last_name,
              email
            )
          ),
          profiles!fk_activities_user_id (
            first_name,
            last_name,
            email
          )
        `)
        .gte('start_time', periodStart.toISOString())
        .lt('start_time', periodEnd.toISOString())
        .order('start_time', { ascending: true });

      if (!isTeamView) {
        query = query.eq('user_id', user?.id);
      } else if (selectedUserId !== 'all') {
        query = query.eq('user_id', selectedUserId);
      }

      if (projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      if (activityType !== 'all') {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[useActivityData] Error fetching activities:", error);
        throw error;
      }

      console.log("[useActivityData] Fetched activities:", data);
      return data;
    },
    enabled: !!user,
  });

  return { activities, isLoading, error };
};

export const processActivityData = (activities: Activity[] | null, periodStart: Date, getDaysInPeriod: () => number) => {
  const allDays: DayActivity[] = Array.from({ length: getDaysInPeriod() }, (_, i) => {
    const date = addDays(periodStart, i);
    return {
      date,
      day: format(date, 'EEEE', { locale: fr }),
      total: 0,
      activities: [],
      byType: {} as Record<ActivityType, number>,
    };
  });

  const dailyActivities = activities?.reduce((acc, activity) => {
    const activityDate = new Date(activity.start_time);
    const day = format(activityDate, 'EEEE', { locale: fr });
    const dayIndex = allDays.findIndex(d => d.day === day);
    
    if (dayIndex !== -1) {
      // Ensure activity.duration_minutes is treated as a number
      const duration = Number(activity.duration_minutes) || 0;
      allDays[dayIndex].total += duration;
      allDays[dayIndex].activities.push(activity);
      
      // Convert minutes to hours for the chart
      const durationHours = duration / 60;
      const activityType = activity.activity_type;
      
      // Initialize the byType object with 0 if it doesn't exist
      if (typeof allDays[dayIndex].byType[activityType] !== 'number') {
        allDays[dayIndex].byType[activityType] = 0;
      }
      
      allDays[dayIndex].byType[activityType] = 
        allDays[dayIndex].byType[activityType] + durationHours;
    }
    
    return acc;
  }, allDays) || allDays;

  const chartData = dailyActivities.map(({ date, byType }) => ({
    day: format(date, 'EEE', { locale: fr }),
    ...Object.fromEntries(
      Object.entries(byType).map(([type, hours]) => [
        type,
        Math.round(hours * 100) / 100
      ])
    )
  }));

  return { dailyActivities, chartData };
};
