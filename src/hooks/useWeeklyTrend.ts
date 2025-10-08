/**
 * Hook pour récupérer les données de tendance sur plusieurs semaines
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

interface WeeklyTrendProps {
  isTeamView: boolean;
  weekStartDate: Date;
  projectId: string;
  activityType: string;
  selectedUserId: string;
  weeksCount?: number; // Nombre de semaines à afficher (par défaut 6)
}

export const useWeeklyTrend = ({
  isTeamView,
  weekStartDate,
  projectId,
  activityType,
  selectedUserId,
  weeksCount = 6
}: WeeklyTrendProps) => {
  return useQuery({
    queryKey: ['weekly-trend', weekStartDate.toISOString(), projectId, activityType, selectedUserId, isTeamView, weeksCount],
    queryFn: async () => {
      const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      const oldestWeek = subWeeks(weekStart, weeksCount - 1);

      let query = supabase
        .from('activity_points')
        .select(`
          *,
          projects (
            id,
            title
          )
        `)
        .gte('week_start_date', format(oldestWeek, 'yyyy-MM-dd'))
        .lte('week_start_date', format(weekStart, 'yyyy-MM-dd'));

      // Filtres
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      if (activityType && activityType !== 'all') {
        query = query.eq('activity_type', activityType);
      }

      if (isTeamView && selectedUserId && selectedUserId !== 'all') {
        query = query.eq('user_id', selectedUserId);
      } else if (!isTeamView) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('user_id', user.id);
        }
      }

      const { data, error } = await query.order('week_start_date', { ascending: true });

      if (error) throw error;

      // Enrichir avec les labels des types d'activités
      const { data: activityTypes } = await supabase
        .from('activity_types')
        .select('code, label, color');

      const enrichedData = data?.map(point => ({
        ...point,
        activity_types: point.activity_type 
          ? activityTypes?.find(at => at.code === point.activity_type)
          : null
      }));

      return enrichedData || [];
    }
  });
};

/**
 * Traite les données de tendance pour générer les données de graphique par semaine
 */
export const processWeeklyTrendData = (points: any[], weeksCount: number, latestWeekStart: Date) => {
  const weeks: any[] = [];
  
  // Générer les semaines
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = subWeeks(startOfWeek(latestWeekStart, { weekStartsOn: 1 }), i);
    weeks.push({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      label: `S${format(weekStart, 'ww')}`
    });
  }

  // Agréger les points par semaine et par type d'activité
  const chartData = weeks.map(week => {
    const weekData: any = {
      week: week.label,
      weekStart: week.weekStart
    };

    // Récupérer tous les types d'activités uniques
    const activityTypeCodes = new Set<string>();
    points.forEach(point => {
      if (point.week_start_date === week.weekStart) {
        const code = point.activity_type || 'non_categorise';
        activityTypeCodes.add(code);
        
        if (!weekData[code]) {
          weekData[code] = 0;
        }
        weekData[code] += point.points;
      }
    });

    return weekData;
  });

  return chartData;
};
