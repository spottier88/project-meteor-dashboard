
import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/activity';

export const useEventSelection = (initialEvents: CalendarEvent[]) => {
  const [modifiedEvents, setModifiedEvents] = useState<{ [key: string]: CalendarEvent }>(
    Object.fromEntries(initialEvents.map(event => [event.id, { ...event, selected: false }]))
  );

  useEffect(() => {
    if (initialEvents.length > 0) {
      setModifiedEvents(prevModifiedEvents => 
        Object.fromEntries(
          initialEvents.map(event => {
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
  
  // Mise à jour: un événement est valide s'il a un type d'activité et un titre/description
  // Le projectId n'est plus obligatoire
  const canImport = selectedEvents.length > 0 && selectedEvents.every(event => 
    event.activityType && 
    (event.description || event.title)
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
