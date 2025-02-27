
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from '@/integrations/supabase/types';
import { EventRow } from './EventRow';

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

interface EventTableProps {
  events: CalendarEvent[];
  projects?: Project[];
  onToggleSelection: (eventId: string) => void;
  onToggleAllEvents: (selected: boolean) => void;
  onEventChange: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  projects,
  onToggleSelection,
  onToggleAllEvents,
  onEventChange,
}) => {
  const activityTypes: { type: ActivityType; label: string }[] = [
    { type: 'meeting', label: 'Réunion' },
    { type: 'development', label: 'Développement' },
    { type: 'testing', label: 'Tests' },
    { type: 'documentation', label: 'Documentation' },
    { type: 'support', label: 'Support' },
    { type: 'other', label: 'Autre' },
  ];

  const allEventsSelected = events.every(event => event.selected);

  return (
    <ScrollArea className="h-[600px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allEventsSelected}
                onCheckedChange={(checked) => onToggleAllEvents(!!checked)}
              />
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Type d'activité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              projects={projects}
              activityTypes={activityTypes}
              onToggleSelection={onToggleSelection}
              onEventChange={onEventChange}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
