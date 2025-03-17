
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
import { EventRow } from './EventRow';
import { ActivityType, CalendarEvent } from '@/types/activity';

interface Project {
  id: string;
  title: string;
}

interface EventTableProps {
  events: CalendarEvent[];
  projects?: Project[];
  activityTypes: ActivityType[];
  onToggleSelection: (eventId: string) => void;
  onToggleAllEvents: (selected: boolean) => void;
  onEventChange: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  projects,
  activityTypes,
  onToggleSelection,
  onToggleAllEvents,
  onEventChange,
}) => {
  const allEventsSelected = events.every(event => event.selected);

  return (
    <ScrollArea className="h-[500px]">
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
