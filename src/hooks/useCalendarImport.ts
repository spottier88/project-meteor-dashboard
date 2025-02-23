
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

interface ICalEvent {
  type: string;
  uid?: string;
  summary: string;
  start: Date;
  end: Date;
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

  const parseICSContent = (icsContent: string, startDate: Date): CalendarEvent[] => {
    const lines = icsContent.split('\n');
    let events: CalendarEvent[] = [];
    let currentEvent: Partial<ICalEvent> = {};
    let isInEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        isInEvent = true;
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        isInEvent = false;
        if (currentEvent.type === 'VEVENT' && 
            currentEvent.start && 
            currentEvent.end && 
            currentEvent.start >= startDate) {
          const duration = Math.round(
            (currentEvent.end.getTime() - currentEvent.start.getTime()) / (1000 * 60)
          );
          
          events.push({
            id: currentEvent.uid || `event-${i}`,
            title: currentEvent.summary || 'Untitled Event',
            startTime: currentEvent.start,
            endTime: currentEvent.end,
            duration,
          });
        }
      } else if (isInEvent) {
        if (line.startsWith('UID:')) {
          currentEvent.uid = line.substring(4);
          currentEvent.type = 'VEVENT';
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DTSTART')) {
          const dateStr = line.split(':')[1];
          currentEvent.start = new Date(dateStr);
        } else if (line.startsWith('DTEND')) {
          const dateStr = line.split(':')[1];
          currentEvent.end = new Date(dateStr);
        }
      }
    }

    return events;
  };

  const fetchEventsMutation = useMutation({
    mutationFn: async ({ calendarUrl, startDate }: { calendarUrl: string; startDate: Date }) => {
      const response = await fetch(calendarUrl);
      if (!response.ok) {
        throw new Error("Impossible de récupérer les données du calendrier");
      }

      const icsData = await response.text();
      const events = parseICSContent(icsData, startDate);
      setEvents(events);
      return events;
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

      const hasInvalidEvents = selectedEvents.some(event => !event.activityType || !event.projectId);
      if (hasInvalidEvents) {
        throw new Error('Tous les événements doivent avoir un type d\'activité et un projet assigné');
      }

      const { error: importError } = await supabase.from('calendar_imports').insert({
        calendar_url: calendarUrl,
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) throw importError;

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
      setEvents([]);
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
