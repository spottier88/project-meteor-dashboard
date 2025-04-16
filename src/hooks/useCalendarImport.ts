
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent } from '@/types/activity';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useActivityTypes } from './useActivityTypes';

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
  const { data: activityTypes } = useActivityTypes();

  const { data: projectCodes } = useQuery({
    queryKey: ['project-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_codes')
        .select('code, project_id');
      
      if (error) {
        console.error('Erreur lors de la récupération des codes projet:', error);
        throw error;
      }
      
      return data || [];
    },
  });

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
      
      if (!currentAuthStatus) {
        // console.log('useCalendarImport: Non authentifié, impossible de récupérer les événements');
        throw new Error("Vous devez d'abord vous connecter à Microsoft");
      }
      
      try {
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
          throw new Error("Aucun événement trouvé");
        }

        const transformedEvents = data.events.map(event => {
          let projectId = null;
          let activityType = null;
          
          // Traitement du code projet
          if (event.projectCode && projectCodes) {
            const matchingCode = projectCodes.find(pc => pc.code === event.projectCode);
            if (matchingCode) {
              projectId = matchingCode.project_id;
              // console.log(`Code projet trouvé: ${event.projectCode} => ${projectId}`);
            }
          }
          
          // Traitement du code type d'activité
          if (event.activityTypeCode && activityTypes) {
            const matchingActivityType = activityTypes.find(at => `A-${at.code}` === event.activityTypeCode);
            if (matchingActivityType) {
              activityType = matchingActivityType.code;
              // console.log(`Code type d'activité trouvé: ${event.activityTypeCode} => ${activityType}`);
            }
          }

          // Présélectionner automatiquement les événements avec un code projet ou un code type d'activité
          const shouldBeSelected = 
            (event.projectCode !== null && event.projectCode !== undefined) || 
            (event.activityTypeCode !== null && event.activityTypeCode !== undefined);

          return {
            ...event,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            selected: shouldBeSelected,
            projectId: projectId,
            activityType: activityType
          };
        });
        
        // Trier les événements par date de début (du plus ancien au plus récent)
        const sortedEvents = transformedEvents.sort((a, b) => 
          a.startTime.getTime() - b.startTime.getTime()
        );
        
        // console.log('Événements triés par date de début');
        
        setEvents(sortedEvents);
        return sortedEvents;
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
      
      const validActivityTypeCodes = activityTypes ? activityTypes.map(type => type.code) : [];
      
      const invalidEvents = eventsToImport.filter(event => 
        !event.activityType || 
        !validActivityTypeCodes.includes(event.activityType)
      );

      if (invalidEvents.length > 0) {
        throw new Error(
          `${invalidEvents.length} événement(s) ont des types d'activité invalides. ` +
          `Les types autorisés sont: ${validActivityTypeCodes.join(', ')}.`
        );
      }

      // console.log('Import de', eventsToImport.length, 'événements');

      const { error: importError } = await supabase.from('calendar_imports').insert({
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (importError) {
        console.error('Erreur d\'enregistrement de l\'import:', importError);
        throw importError;
      }

      const activitiesToInsert = eventsToImport.map(event => ({
        user_id: user.id,
        description: event.description || event.title,
        start_time: event.startTime instanceof Date ? event.startTime.toISOString() : new Date(event.startTime).toISOString(),
        duration_minutes: event.duration,
        activity_type: event.activityType,
        project_id: event.projectId || null, // Peut être null maintenant
      }));

      // console.log('Activités à insérer:', activitiesToInsert);

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
    projectCodes,
  };
};
