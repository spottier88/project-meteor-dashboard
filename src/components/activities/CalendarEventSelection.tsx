
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EventTable } from './calendar-events/EventTable';
import { EventSelectionFooter } from './calendar-events/EventSelectionFooter';
import { useEventSelection } from './calendar-events/useEventSelection';
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { CalendarEvent } from '@/types/activity';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Project {
  id: string;
  title: string;
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
  const { data: activityTypes, isLoading: isLoadingTypes } = useActivityTypes(true, true);

  const handleToggleSelection = (eventId: string) => {
    handleEventChange(eventId, { selected: !modifiedEvents.find(e => e.id === eventId)?.selected });
    onToggleSelection(eventId);
  };

  const handleToggleAllEvents = (selected: boolean) => {
    modifiedEvents.forEach(event => {
      handleEventChange(event.id, { selected });
    });
    if (onToggleAllEvents) {
      onToggleAllEvents(selected);
    }
  };

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

  const noActivityTypesAvailable = !isLoadingTypes && (!activityTypes || activityTypes.length === 0);

  const handleCombinedEventChange = (eventId: string, updates: Partial<CalendarEvent>) => {
    handleEventChange(eventId, updates);
    if (onEventChange) {
      onEventChange(eventId, updates);
    }
  };

  return (
    <div className="space-y-6">
      {noActivityTypesAvailable && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez accès à aucun type d'activité. Veuillez contacter un administrateur.
          </AlertDescription>
        </Alert>
      )}

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
        canImport={canImport && !noActivityTypesAvailable}
        isLoading={isLoading}
        onCancel={onCancel}
        onImport={() => onImport(selectedEvents)}
        events={selectedEvents}
      />
    </div>
  );
};
