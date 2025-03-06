
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, ActivityTypeEnum } from '@/types/activity';
import { useMicrosoftAuth } from './useMicrosoftAuth';

interface CalendarImport {
  id: string;
  calendar_url?: string;
  import_date: string;
  start_date: string;
}

export const useCalendarImport = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDate, setImportDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { isAuthenticated, getMSALInstance, logout, checkAuthStatus } = useMicrosoftAuth();

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
      const currentAuthStatus = checkAuthStatus();
      console.log('useCalendarImport: Vérification de l\'état d\'authentification en temps réel:', currentAuthStatus);
      
      if (!currentAuthStatus) {
        console.log('useCalendarImport: Non authentifié, impossible de récupérer les événements');
        throw new Error("Vous devez d'abord vous connecter à Microsoft");
      }

      console.log('useCalendarImport: Récupération des événements du calendrier...');
      console.log('useCalendarImport: Période:', startDate.toISOString(), 'à', endDate.toISOString());
      
      try {
        const msalInstance = getMSALInstance();
        if (!msalInstance) {
          console.log('useCalendarImport: MSAL instance not available');
          throw new Error("Instance MSAL non disponible");
        }

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
          console.log('useCalendarImport: No Microsoft account connected');
          throw new Error("Aucun compte Microsoft connecté");
        }

        const accessTokenRequest = {
          scopes: ["Calendars.Read"],
          account: accounts[0]
        };

        console.log('useCalendarImport: Acquiring token silently');
        const tokenResponse = await msalInstance.acquireTokenSilent(accessTokenRequest);
        console.log('useCalendarImport: Token acquired successfully');
        
        console.log('useCalendarImport: Calling edge function to fetch calendar');
        const { data, error } = await supabase.functions.invoke('fetch-ms-calendar', {
          body: {
            accessToken: tokenResponse.accessToken,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }
        });

        if (error) {
          console.error('useCalendarImport: Erreur fonction edge:', error);
          throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
        }

        if (!data?.events) {
          console.log('useCalendarImport: No events found');
          throw new Error("Aucun événement trouvé");
        }

        const transformedEvents = data.events.map(event => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          selected: false
        }));
        
        console.log('useCalendarImport: Événements récupérés:', transformedEvents.length);
        setEvents(transformedEvents);
        return transformedEvents;
      } catch (error: any) {
        console.error('useCalendarImport: Erreur lors de la récupération des événements:', error);
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error('useCalendarImport: Error fetching calendar events:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur s'est produite lors de la récupération des événements.",
        variant: 'destructive',
      });
      setEvents([]);
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

      const eventsToImport = selectedEvents.filter(event => event.selected);
      
      if (eventsToImport.length === 0) {
        throw new Error('Aucun événement sélectionné pour l\'import');
      }

      const invalidEvents = eventsToImport.filter(event => 
        !event.activityType || 
        !event.projectId || 
        (!event.description && !event.title)
      );

      if (invalidEvents.length > 0) {
        throw new Error(
          `${invalidEvents.length} événement(s) manquent des informations nécessaires. ` +
          'Tous les événements doivent avoir une description, un type d\'activité et un projet.'
        );
      }

      console.log('Import de', eventsToImport.length, 'événements');

      const { error: importError } = await supabase.from('calendar_imports').insert({
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) {
        console.error('Erreur d\'enregistrement de l\'import:', importError);
        throw importError;
      }

      // Cast activity_type to the expected enum type
      const activitiesToInsert = eventsToImport.map(event => ({
        user_id: user.id,
        description: event.description || event.title,
        start_time: event.startTime instanceof Date ? event.startTime.toISOString() : new Date(event.startTime).toISOString(),
        duration_minutes: event.duration,
        activity_type: event.activityType as ActivityTypeEnum,
        project_id: event.projectId as string,
      }));

      console.log('Activités à insérer:', activitiesToInsert);

      // Cast the entire array to any to bypass the strict type checking
      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activitiesToInsert as any);

      if (activitiesError) {
        console.error('Erreur d\'insertion des activités:', activitiesError);
        throw activitiesError;
      }

      return eventsToImport.length;
    },
    onSuccess: () => {
      try {
        if (logout) {
          logout();
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion de Microsoft:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['calendar-imports'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: 'Succès',
        description: 'Les événements ont été importés avec succès.',
      });
      setEvents([]);
    },
    onError: (error: any) => {
      console.error('Error importing calendar:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur s'est produite lors de l'importation du calendrier.",
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

  const toggleAllEvents = (selected: boolean) => {
    setEvents(prevEvents =>
      prevEvents.map(event => ({ ...event, selected }))
    );
  };

  const updateEventDetails = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, ...updates }
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
    toggleAllEvents,
    updateEventDetails,
  };
};
