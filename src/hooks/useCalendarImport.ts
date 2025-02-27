
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
  const { isAuthenticated, getMSALInstance, logout } = useMicrosoftAuth();

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
      console.log('Période:', startDate.toISOString(), 'à', endDate.toISOString());
      
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
          throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
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
      } catch (error: any) {
        console.error('Erreur lors de la récupération des événements:', error);
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching calendar events:', error);
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

      // Filtrer uniquement les événements sélectionnés
      const eventsToImport = selectedEvents.filter(event => event.selected);
      
      // Vérifier si des événements sont sélectionnés
      if (eventsToImport.length === 0) {
        throw new Error('Aucun événement sélectionné pour l\'import');
      }

      // Vérifier si tous les événements ont les informations requises
      const invalidEvents = eventsToImport.filter(event => 
        !event.activityType || 
        !event.projectId || 
        !event.title || 
        event.title.trim() === ''
      );

      if (invalidEvents.length > 0) {
        throw new Error(
          `${invalidEvents.length} événement(s) manquent des informations nécessaires. ` +
          'Tous les événements doivent avoir un titre, un type d\'activité et un projet.'
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

      // Préparer les activités à insérer
      const activitiesToInsert = eventsToImport.map(event => ({
        user_id: user.id,
        description: event.description || event.title, // Utiliser la description ou le titre
        title: event.title,
        start_time: event.startTime instanceof Date ? event.startTime.toISOString() : new Date(event.startTime).toISOString(),
        duration_minutes: event.duration,
        activity_type: event.activityType,
        project_id: event.projectId,
      }));

      console.log('Activités à insérer:', activitiesToInsert);

      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activitiesToInsert);

      if (activitiesError) {
        console.error('Erreur d\'insertion des activités:', activitiesError);
        throw activitiesError;
      }

      return eventsToImport.length;
    },
    onSuccess: () => {
      // Déconnexion de Microsoft après import réussi
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

  // Fonction pour sélectionner/désélectionner tous les événements
  const toggleAllEvents = (selected: boolean) => {
    setEvents(prevEvents =>
      prevEvents.map(event => ({ ...event, selected }))
    );
  };

  // Fonction pour mettre à jour les détails d'un événement (titre, description, etc.)
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
