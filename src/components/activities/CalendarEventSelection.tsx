
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { EventTable } from './calendar-events/EventTable';
import { EventSelectionFooter } from './calendar-events/EventSelectionFooter';
import { useEventSelection } from './calendar-events/useEventSelection';

type ActivityType = Database['public']['Enums']['activity_type'];

interface Project {
  id: string;
  title: string;
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

  // Effet pour synchroniser les événements modifiés avec le parent quand ils changent
  useEffect(() => {
    if (onEventChange) {
      Object.values(modifiedEvents).forEach(event => {
        if (event.selected) {
          onEventChange(event.id, event);
        }
      });
    }
  }, [modifiedEvents, onEventChange]);

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_accessible_projects', { p_user_id: (await supabase.auth.getUser()).data.user?.id });

      if (error) throw error;
      return data as Project[];
    }
  });

  if (isLoadingProjects) {
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
        events={events}
        projects={projects}
        onToggleSelection={onToggleSelection}
        onToggleAllEvents={onToggleAllEvents}
        onEventChange={handleCombinedEventChange}
      />

      <EventSelectionFooter 
        selectedCount={selectedCount}
        canImport={canImport}
        isLoading={isLoading}
        onCancel={onCancel}
        onImport={() => onImport(Object.values(modifiedEvents))}
        events={Object.values(modifiedEvents)}
      />
    </div>
  );
};
