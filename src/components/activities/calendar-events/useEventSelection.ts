
import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/activity';

export const useEventSelection = (initialEvents: CalendarEvent[]) => {
  const [modifiedEvents, setModifiedEvents] = useState<{ [key: string]: CalendarEvent }>(
    Object.fromEntries(initialEvents.map(event => [event.id, { ...event, selected: false }]))
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialState, setInitialState] = useState<{ [key: string]: CalendarEvent }>({});

  useEffect(() => {
    if (initialEvents.length > 0) {
      const newEvents = Object.fromEntries(
        initialEvents.map(event => {
          const existingEvent = modifiedEvents[event.id];
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
      );
      
      setModifiedEvents(newEvents);
      // Stocker l'état initial pour détecter les modifications
      setInitialState(JSON.parse(JSON.stringify(newEvents)));
      setHasUnsavedChanges(false);
    }
  }, [initialEvents]);

  // Détection des modifications
  useEffect(() => {
    if (Object.keys(initialState).length === 0) return;

    // Vérifier si des événements ont été modifiés
    const hasChanges = Object.keys(modifiedEvents).some(eventId => {
      const initialEvent = initialState[eventId];
      const currentEvent = modifiedEvents[eventId];
      
      if (!initialEvent) return true;
      
      return (
        initialEvent.selected !== currentEvent.selected ||
        initialEvent.activityType !== currentEvent.activityType ||
        initialEvent.projectId !== currentEvent.projectId ||
        initialEvent.title !== currentEvent.title ||
        initialEvent.description !== currentEvent.description
      );
    });
    
    setHasUnsavedChanges(hasChanges);
  }, [modifiedEvents, initialState]);

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

  const resetChanges = () => {
    setHasUnsavedChanges(false);
  };

  return {
    modifiedEvents: Object.values(modifiedEvents),
    selectedEvents,
    canImport,
    selectedCount,
    hasUnsavedChanges,
    resetChanges,
    handleEventChange
  };
};
