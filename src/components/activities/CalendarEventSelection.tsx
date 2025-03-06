
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EventTable } from './calendar-events/EventTable';
import { EventSelectionFooter } from './calendar-events/EventSelectionFooter';
import { useEventSelection } from './calendar-events/useEventSelection';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface Project {
  id: string;
  title: string;
}

// Define the CalendarEvent interface with string for activityType
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: string;  // Changed to string to accept any activity type code
  projectId?: string;
  selected?: boolean;
}

interface Props {
  events: CalendarEvent[];
  onImport: (events: CalendarEvent[]) => void;
  onCancel: () => void;
  isLoading: boolean;
  onToggleSelection: (eventId: string) => void;
  onToggleAllEvents?: (selected: boolean) => void;
  onEventChange?: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const CalendarEventSelection = ({ 
  events, 
  onImport, 
  onCancel, 
  isLoading,
  onToggleSelection,
  onToggleAllEvents = () => {},
  onEventChange,
}: Props) => {
  const { modifiedEvents, selectedEvents, canImport, selectedCount, handleEventChange } = useEventSelection(events);
  const { data: activityTypes, isLoading: isLoadingTypes } = useActivityTypes();

  // Synchronisation des sélections entre les composants
  const handleToggleSelection = (eventId: string) => {
    // Mettre à jour l'état local via useEventSelection
    handleEventChange(eventId, { selected: !modifiedEvents.find(e => e.id === eventId)?.selected });
    
    // Propager au parent
    onToggleSelection(eventId);
  };

  // Synchronisation de tous les événements
  const handleToggleAllEvents = (selected: boolean) => {
    // Mettre à jour tous les événements dans l'état local
    modifiedEvents.forEach(event => {
      handleEventChange(event.id, { selected });
    });
    
    // Propager au parent
    if (onToggleAllEvents) {
      onToggleAllEvents(selected);
    }
  };

  // Effet pour synchroniser les événements modifiés avec le parent quand ils changent
  useEffect(() => {
    if (onEventChange && modifiedEvents.length > 0) {
      modifiedEvents.forEach(event => {
        const existingEvent = events.find(e => e.id === event.id);
        if (existingEvent && (
          existingEvent.title !== event.title ||
          existingEvent.description !== event.description ||
          existingEvent.activityType !== event.activityType ||
          existingEvent.projectId !== event.projectId ||
          existingEvent.selected !== event.selected
        )) {
          onEventChange(event.id, event);
        }
      });
    }
  }, [modifiedEvents, onEventChange, events]);

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_accessible_projects', { p_user_id: (await supabase.auth.getUser()).data.user?.id });

      if (error) throw error;
      return data as Project[];
    }
  });

  if (isLoadingProjects || isLoadingTypes) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Handler pour propager les changements d'événements vers le parent et le state local
  const handleCombinedEventChange = (eventId: string, updates: Partial<CalendarEvent>) => {
    // Mettre à jour l'état local via useEventSelection
    handleEventChange(eventId, updates);
    
    // Propager les changements vers le parent si nécessaire
    if (onEventChange) {
      onEventChange(eventId, updates);
    }
  };

  return (
    <div className="space-y-6">
      <EventTable 
        events={modifiedEvents}
        projects={projects}
        activityTypes={activityTypes || []}
        onToggleSelection={handleToggleSelection}
        onToggleAllEvents={handleToggleAllEvents}
        onEventChange={handleCombinedEventChange}
      />

      <EventSelectionFooter 
        selectedCount={selectedCount}
        canImport={canImport}
        isLoading={isLoading}
        onCancel={onCancel}
        onImport={() => onImport(selectedEvents)}
        events={selectedEvents}
      />
    </div>
  );
};
