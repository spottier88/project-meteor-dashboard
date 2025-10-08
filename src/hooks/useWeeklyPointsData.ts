/**
 * Hook pour récupérer et traiter les données de points hebdomadaires
 * avec filtres pour la vue équipe
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeeklyPointsDataProps {
  isTeamView: boolean;
  weekStartDate: Date;
  projectId: string;
  activityType: string;
  selectedUserId: string;
}

export const useWeeklyPointsData = ({
  isTeamView,
  weekStartDate,
  projectId,
  activityType,
  selectedUserId
}: WeeklyPointsDataProps) => {
  return useQuery({
    queryKey: ['weekly-points-data', weekStartDate.toISOString(), projectId, activityType, selectedUserId, isTeamView],
    queryFn: async () => {
      const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });

      let query = supabase
        .from('activity_points')
        .select(`
          *,
          projects (
            id,
            title
          )
        `)
        .gte('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('week_start_date', format(weekEnd, 'yyyy-MM-dd'));

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

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les profils des utilisateurs concernés
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      // Enrichir avec les labels des types d'activités
      const { data: activityTypes } = await supabase
        .from('activity_types')
        .select('code, label, color');

      const enrichedData = data?.map(point => {
        const profile = profiles?.find(p => p.id === point.user_id);
        return {
          ...point,
          profiles: profile,
          activity_types: point.activity_type 
            ? activityTypes?.find(at => at.code === point.activity_type)
            : null
        };
      });

      return enrichedData || [];
    }
  });
};

/**
 * Traite les données de points pour générer les données de graphique par jour
 */
export const processWeeklyPointsData = (points: any[], weekStartDate: Date) => {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const daysInWeek = 7;

  // Initialiser les données pour chaque jour de la semaine
  const chartData: any[] = [];
  for (let i = 0; i < daysInWeek; i++) {
    const date = addDays(weekStart, i);
    chartData.push({
      day: format(date, 'EEE dd', { locale: fr }),
      date: format(date, 'yyyy-MM-dd')
    });
  }

  // Agréger les points par jour et par type d'activité
  points.forEach(point => {
    const dayData = chartData.find(d => d.date === point.week_start_date);
    if (dayData && point.activity_type) {
      if (!dayData[point.activity_type]) {
        dayData[point.activity_type] = 0;
      }
      dayData[point.activity_type] += point.points;
    }
  });

  return chartData;
};
