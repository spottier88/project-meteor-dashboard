
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
  description?: string;
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

        // Transformation des dates string en objets Date
        const transformedEvents = data.events.map(event => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          selected: false // État initial de la sélection
        }));
        
        console.log('Événements récupérés:', transformedEvents.length);
        setEvents(transformedEvents);
        return transformedEvents;
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

      // Ne vérifier que les événements sélectionnés et s'assurer qu'ils ont un titre non vide
      const hasInvalidEvents = selectedEvents
        .filter(event => event.selected)
        .some(event => 
          !event.activityType || 
          !event.projectId || 
          !event.title || 
          event.title.trim() === ''
        );

      if (hasInvalidEvents) {
        throw new Error('Tous les événements sélectionnés doivent avoir un titre, un type d\'activité et un projet assigné');
      }

      const { error: importError } = await supabase.from('calendar_imports').insert({
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) throw importError;

      // N'insérer que les événements sélectionnés et assurer que toutes les dates sont des objets Date
      const activitiesToInsert = selectedEvents
        .filter(event => event.selected)
        .map(event => ({
          user_id: user.id,
          description: event.description || event.title, // Utiliser la description si disponible, sinon le titre
          start_time: event.startTime instanceof Date ? event.startTime.toISOString() : new Date(event.startTime).toISOString(),
          duration_minutes: event.duration,
          activity_type: event.activityType,
          project_id: event.projectId,
        }));

      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activitiesToInsert);

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

  // Fonction pour sélectionner/désélectionner tous les événements
  const toggleAllEvents = (selected: boolean) => {
    setEvents(prevEvents =>
      prevEvents.map(event => ({ ...event, selected }))
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
  };
};
