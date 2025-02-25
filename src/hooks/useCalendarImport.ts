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
  selected?: boolean;
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
  const [endDate, setEndDate] = useState<Date>(new Date());
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

  const windowsToIanaTimezones: { [key: string]: string } = {
    "Greenwich Standard Time": "Etc/GMT",
    "Romance Standard Time": "Europe/Paris",
    "Pacific Standard Time": "America/Los_Angeles",
    "Eastern Standard Time": "America/New_York",
  };

  const parseDateTime = (dateStr: string, tzid?: string): Date | null => {
    try {
      console.log(`🔹 Lecture de la date: ${dateStr}, fuseau: ${tzid}`);

      // Gestion des événements sur la journée entière
      if (dateStr.includes(';VALUE=DATE:')) {
        console.log(`⛔ Ignoré (événement sur la journée entière) : ${dateStr}`);
        return null;
      }

      let finalDateStr = dateStr;
      let userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let eventTz = tzid || "UTC";

      if (dateStr.includes('TZID=')) {
        const parts = dateStr.split(':');
        const tzParts = parts[0].split('TZID=');
        eventTz = tzParts[1];
        finalDateStr = parts[1];

        console.log(`🌍 Fuseau horaire Windows détecté: ${eventTz}`);

        if (eventTz in windowsToIanaTimezones) {
          eventTz = windowsToIanaTimezones[eventTz];
          console.log(`🔄 Converti en fuseau IANA: ${eventTz}`);
        }
      } else if (dateStr.includes(':')) {
        finalDateStr = dateStr.split(':')[1];
      }

      if (!finalDateStr) {
        console.warn('❌ Problème de parsing: date vide.');
        return null;
      }

      const year = finalDateStr.substr(0, 4);
      const month = finalDateStr.substr(4, 2);
      const day = finalDateStr.substr(6, 2);
      const hour = finalDateStr.substr(9, 2) || '00';
      const minute = finalDateStr.substr(11, 2) || '00';
      const second = finalDateStr.substr(13, 2) || '00';

      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      console.log(`📅 Date ISO: ${isoString}, fuseau source: ${eventTz}, fuseau cible: ${userTz}`);

      const parsedDate = parseISO(isoString);
      const zonedDate = toZonedTime(parsedDate, eventTz);

      // On convertit dans le fuseau de l'utilisateur
      const userDate = toZonedTime(zonedDate, userTz);
      
      console.log(`🎯 Date finale: ${format(userDate, 'yyyy-MM-dd HH:mm:ss')} (${userTz})`);
      
      return userDate;
    } catch (error) {
      console.error('❌ Erreur lors du parsing de la date:', error);
      return null;
    }
  };

  const parseICSContent = (icsContent: string, startDate: Date, endDate: Date): CalendarEvent[] => {
    const lines = icsContent.split('\n');
    let events: CalendarEvent[] = [];
    let currentEvent: Partial<ICalEvent> = {};
    let isInEvent = false;
    let currentTzid: string | undefined;

    console.log('🔍 Début du parsing ICS');
    console.log('📄 Nombre de lignes:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        isInEvent = true;
        currentEvent = {};
        currentTzid = undefined;
      } else if (line === 'END:VEVENT') {
        isInEvent = false;

        if (
          currentEvent.type === 'VEVENT' &&
          currentEvent.start &&
          currentEvent.end &&
          currentEvent.start >= startDate &&
          currentEvent.end <= endDate &&
          !currentEvent.isAllDay
        ) {
          const duration = Math.round((currentEvent.end.getTime() - currentEvent.start.getTime()) / (1000 * 60));

          events.push({
            id: currentEvent.uid || `event-${i}`,
            title: currentEvent.summary || 'Sans titre',
            startTime: currentEvent.start,
            endTime: currentEvent.end,
            duration,
            selected: true,
          });

          console.log(`✅ Événement ajouté: ${currentEvent.summary}`);
        } else {
          console.warn('🚫 Événement ignoré:', currentEvent);
        }
      } else if (isInEvent) {
        if (line.startsWith('UID:')) {
          currentEvent.uid = line.substring(4);
          currentEvent.type = 'VEVENT';
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DTSTART')) {
          const parsedDate = parseDateTime(line, currentTzid);
          if (parsedDate) {
            currentEvent.start = parsedDate;
          } else {
            currentEvent.isAllDay = true;
          }
        } else if (line.startsWith('DTEND')) {
          const parsedDate = parseDateTime(line, currentTzid);
          if (parsedDate) {
            currentEvent.end = parsedDate;
          }
        } else if (line.startsWith('TZID:')) {
          currentTzid = line.substring(5);
        }
      }
    }

    return events;
  };

  const fetchEventsMutation = useMutation({
    mutationFn: async ({ 
      calendarUrl, 
      startDate,
      endDate,
    }: { 
      calendarUrl: string; 
      startDate: Date;
      endDate: Date;
    }) => {
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
      
      console.log('Parsing calendar data');
      const parsedEvents = parseICSContent(data.icsData, startDate, endDate);
      setEvents(parsedEvents);
      return parsedEvents;
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

      // Ne vérifier que les événements sélectionnés
      const hasInvalidEvents = selectedEvents
        .filter(event => event.selected)
        .some(event => !event.activityType || !event.projectId);

      if (hasInvalidEvents) {
        throw new Error('Tous les événements sélectionnés doivent avoir un type d\'activité et un projet assigné');
      }

      const { error: importError } = await supabase.from('calendar_imports').insert({
        calendar_url: calendarUrl,
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) throw importError;

      // N'insérer que les événements sélectionnés
      const { error: activitiesError } = await supabase.from('activities').insert(
        selectedEvents
          .filter(event => event.selected)
          .map(event => ({
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

  const toggleEventSelection = (eventId: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, selected: !event.selected }
          : event
      )
    );
  };

  return {
    imports,
    isLoading,
    events,
    importDate,
    setImportDate,
    endDate,
    setEndDate,
    fetchEvents: fetchEventsMutation.mutate,
    isFetchingEvents: fetchEventsMutation.isLoading,
    importCalendar: importMutation.mutate,
    isImporting: importMutation.isLoading,
    toggleEventSelection,
  };
};
