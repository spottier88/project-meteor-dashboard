
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ActivityType = Database['public']['Enums']['activity_type'];

interface CalendarImport {
  id: string;
  calendar_url: string;
  import_date: string;
  start_date: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: ActivityType;
  projectId?: string;
}

export const useCalendarImport = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDate, setImportDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const { data: imports, isLoading } = useQuery({
    queryKey: ['calendar-imports'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('calendar_imports')
        .select('*')
        .order('import_date', { ascending: false });

      if (error) {
        console.error('Error fetching calendar imports:', error);
        throw error;
      }

      return data as CalendarImport[];
    },
    enabled: !!user,
  });

  const fetchEventsMutation = useMutation({
    mutationFn: async ({ calendarUrl, startDate }: { calendarUrl: string; startDate: Date }) => {
      const { data, error } = await supabase.functions.invoke('fetch-calendar-events', {
        body: { calendarUrl, startDate: startDate.toISOString() },
      });

      if (error) throw error;

      // Transformer les données reçues en événements
      const fetchedEvents = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        duration: event.duration,
      }));

      setEvents(fetchedEvents);
      return fetchedEvents;
    },
    onError: (error) => {
      console.error('Error fetching calendar events:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de la récupération des événements.",
        variant: 'destructive',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ 
      calendarUrl, 
      startDate,
      selectedEvents,
    }: { 
      calendarUrl: string; 
      startDate: Date;
      selectedEvents: CalendarEvent[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Vérifier que tous les événements ont un type d'activité et un projet
      const hasInvalidEvents = selectedEvents.some(event => !event.activityType || !event.projectId);
      if (hasInvalidEvents) {
        throw new Error('Tous les événements doivent avoir un type d\'activité et un projet assigné');
      }

      // Enregistrer l'import
      const { error: importError } = await supabase.from('calendar_imports').insert({
        calendar_url: calendarUrl,
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) throw importError;

      // Créer les activités
      const { error: activitiesError } = await supabase.from('activities').insert(
        selectedEvents.map(event => ({
          user_id: user.id,
          description: event.title,
          start_time: event.startTime.toISOString(),
          duration_minutes: event.duration,
          activity_type: event.activityType,
          project_id: event.projectId,
        }))
      );

      if (activitiesError) throw activitiesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-imports'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: 'Succès',
        description: 'Les événements ont été importés avec succès.',
      });
      setEvents([]); // Réinitialiser les événements après l'import
    },
    onError: (error) => {
      console.error('Error importing calendar:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'importation du calendrier.",
        variant: 'destructive',
      });
    },
  });

  return {
    imports,
    isLoading,
    events,
    importDate,
    setImportDate,
    fetchEvents: fetchEventsMutation.mutate,
    isFetchingEvents: fetchEventsMutation.isLoading,
    importCalendar: importMutation.mutate,
    isImporting: importMutation.isLoading,
  };
};

