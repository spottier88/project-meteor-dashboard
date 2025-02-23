
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
  isAllDay?: boolean;
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

  const parseDateTime = (dateStr: string, tzid?: string): Date | null => {
    try {
      // Gestion des dates sans heure (événements sur la journée)
      if (dateStr.includes(';VALUE=DATE:')) {
        return null; // On retourne null pour ignorer les événements sur la journée
      }

      // Extraction de la date et du fuseau horaire
      let finalDateStr = dateStr;
      let finalTzid = tzid;

      if (dateStr.includes('TZID=')) {
        const parts = dateStr.split(':');
        const tzParts = parts[0].split('TZID=');
        finalTzid = tzParts[1];
        finalDateStr = parts[1];
      } else if (dateStr.includes(':')) {
        finalDateStr = dateStr.split(':')[1];
      }

      // Formatage de la chaîne de date
      const year = finalDateStr.substr(0, 4);
      const month = finalDateStr.substr(4, 2);
      const day = finalDateStr.substr(6, 2);
      const hour = finalDateStr.substr(9, 2) || '00';
      const minute = finalDateStr.substr(11, 2) || '00';
      const second = finalDateStr.substr(13, 2) || '00';

      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      
      // Conversion avec le fuseau horaire si spécifié
      if (finalTzid) {
        const zonedTime = parseISO(isoString);
        return toZonedTime(zonedTime, finalTzid);
      }

      return new Date(isoString);
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const parseICSContent = (icsContent: string, startDate: Date): CalendarEvent[] => {
    const lines = icsContent.split('\n');
    let events: CalendarEvent[] = [];
    let currentEvent: Partial<ICalEvent> = {};
    let isInEvent = false;
    let currentTzid: string | undefined;
    
    console.log('Début du parsing ICS');
    console.log('Nombre de lignes dans le fichier:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        isInEvent = true;
        currentEvent = {};
        currentTzid = undefined;
      } else if (line === 'END:VEVENT') {
        isInEvent = false;
        if (currentEvent.type === 'VEVENT' && 
            currentEvent.start && 
            currentEvent.end && 
            currentEvent.start >= startDate &&
            !currentEvent.isAllDay) {
          
          // Conversion vers le fuseau horaire local de l'utilisateur
          const localStart = toZonedTime(currentEvent.start, Intl.DateTimeFormat().resolvedOptions().timeZone);
          const localEnd = toZonedTime(currentEvent.end, Intl.DateTimeFormat().resolvedOptions().timeZone);
          
          const duration = Math.round(
            (localEnd.getTime() - localStart.getTime()) / (1000 * 60)
          );
          
          events.push({
            id: currentEvent.uid || `event-${i}`,
            title: currentEvent.summary || 'Untitled Event',
            startTime: localStart,
            endTime: localEnd,
            duration,
          });
        }
      } else if (isInEvent) {
        if (line.startsWith('UID:')) {
          currentEvent.uid = line.substring(4);
          currentEvent.type = 'VEVENT';
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8);
        } else if (line.toLowerCase().includes('dtstart')) {
          const parsedDate = parseDateTime(line, currentTzid);
          if (parsedDate) {
            currentEvent.start = parsedDate;
          } else {
            currentEvent.isAllDay = true;
          }
        } else if (line.toLowerCase().includes('dtend')) {
          const parsedDate = parseDateTime(line, currentTzid);
          if (parsedDate) {
            currentEvent.end = parsedDate;
          }
        }
      }
    }
    
    console.log('Événements parsés:', events);
    return events;
  };

  const fetchEventsMutation = useMutation({
    mutationFn: async ({ calendarUrl, startDate }: { calendarUrl: string; startDate: Date }) => {
      console.log('Fetching calendar data using Edge function');
      const { data, error } = await supabase.functions.invoke('fetch-ics-calendar', {
        body: { calendarUrl }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data.icsData) {
        throw new Error("Données du calendrier non trouvées");
      }
      
      console.log('Réponse de la fonction Edge:', data);
      console.log('Contenu ICS reçu:', data.icsData);
      
      console.log('Parsing calendar data');
      const events = parseICSContent(data.icsData, startDate);
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
