
import { useState, useEffect } from 'react';
import { Database } from '@/integrations/supabase/types';

type ActivityType = Database['public']['Enums']['activity_type'];

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

export const useEventSelection = (initialEvents: CalendarEvent[]) => {
  const [modifiedEvents, setModifiedEvents] = useState<{ [key: string]: CalendarEvent }>(
    Object.fromEntries(initialEvents.map(event => [event.id, { ...event, selected: false }]))
  );

  // Synchroniser avec les événements initiaux quand ils changent
  useEffect(() => {
    if (initialEvents.length > 0) {
      setModifiedEvents(prevModifiedEvents => 
        Object.fromEntries(
          initialEvents.map(event => {
            // Conserver l'état sélectionné et les modifications si l'événement existe déjà
            const existingEvent = prevModifiedEvents[event.id];
            if (existingEvent) {
              return [event.id, { 
                ...event, 
                selected: existingEvent.selected,
                activityType: existingEvent.activityType || event.activityType,
                projectId: existingEvent.projectId || event.projectId,
                title: existingEvent.title || event.title,
                description: existingEvent.description || event.description
              }];
            }
            return [event.id, { ...event, selected: false }];
          })
        )
      );
    }
  }, [initialEvents]);

  const handleEventChange = (eventId: string, updates: Partial<CalendarEvent>) => {
    setModifiedEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], ...updates }
    }));
  };

  const selectedEvents = Object.values(modifiedEvents).filter(event => event.selected);
  
  const canImport = selectedEvents.length > 0 && selectedEvents.every(event => 
    event.activityType && 
    event.projectId && 
    (event.description || event.title) // Vérifier que soit description soit title est présent
  );

  const selectedCount = selectedEvents.length;

  return {
    modifiedEvents: Object.values(modifiedEvents),
    selectedEvents,
    canImport,
    selectedCount,
    handleEventChange
  };
};
