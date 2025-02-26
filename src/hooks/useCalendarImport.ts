
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useMicrosoftAuth } from './useMicrosoftAuth';

type ActivityType = Database['public']['Enums']['activity_type'];

interface CalendarImport {
  id: string;
  calendar_url?: string;
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

export const useCalendarImport = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDate, setImportDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { isAuthenticated, getMSALInstance } = useMicrosoftAuth();

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
    mutationFn: async ({ 
      startDate,
      endDate,
    }: { 
      startDate: Date;
      endDate: Date;
    }) => {
      if (!isAuthenticated) {
        throw new Error("Vous devez d'abord vous connecter à Microsoft");
      }

      console.log('Récupération des événements du calendrier...');
      
      try {
        // Obtenir un token d'accès via MSAL
        const msalInstance = getMSALInstance();
        if (!msalInstance) {
          throw new Error("Instance MSAL non disponible");
        }

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
          throw new Error("Aucun compte Microsoft connecté");
        }

        const accessTokenRequest = {
          scopes: ["Calendars.Read"],
          account: accounts[0]
        };

        const tokenResponse = await msalInstance.acquireTokenSilent(accessTokenRequest);
        
        // Appeler la fonction edge avec le token
        const { data, error } = await supabase.functions.invoke('fetch-ms-calendar', {
          body: {
            accessToken: tokenResponse.accessToken,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }
        });

        if (error) {
          console.error('Erreur fonction edge:', error);
          throw error;
        }

        if (!data?.events) {
          throw new Error("Aucun événement trouvé");
        }
        
        console.log('Événements récupérés:', data.events.length);
        setEvents(data.events);
        return data.events;
      } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        throw error;
      }
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
      startDate,
      selectedEvents,
    }: { 
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
