
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type ActivityType = Database['public']['Enums']['activity_type'];

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: ActivityType;
}

interface CalendarEventSelectionProps {
  events: CalendarEvent[];
  onImport: (selectedEvents: CalendarEvent[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CalendarEventSelection = ({
  events,
  onImport,
  onCancel,
  isLoading = false,
}: CalendarEventSelectionProps) => {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [eventTypes, setEventTypes] = useState<Record<string, ActivityType>>({});

  const toggleEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
      const newEventTypes = { ...eventTypes };
      delete newEventTypes[eventId];
      setEventTypes(newEventTypes);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleActivityTypeChange = (eventId: string, type: ActivityType) => {
    setEventTypes(prev => ({
      ...prev,
      [eventId]: type
    }));
  };

  const handleImport = () => {
    const eventsToImport = events
      .filter(event => selectedEvents.has(event.id))
      .map(event => ({
        ...event,
        activityType: eventTypes[event.id]
      }));
    onImport(eventsToImport);
  };

  const canImport = Array.from(selectedEvents).every(eventId => eventTypes[eventId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sélection des événements</CardTitle>
        <CardDescription>
          Sélectionnez les événements à importer et leur type d'activité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <Checkbox
                  id={event.id}
                  checked={selectedEvents.has(event.id)}
                  onCheckedChange={() => toggleEvent(event.id)}
                />
                <div className="flex-1 grid gap-2">
                  <div>
                    <label
                      htmlFor={event.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.title}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {format(event.startTime, 'Pp', { locale: fr })} -{' '}
                      {format(event.endTime, 'p', { locale: fr })}
                      {' • '}
                      {event.duration} minutes
                    </p>
                  </div>
                  {selectedEvents.has(event.id) && (
                    <Select
                      value={eventTypes[event.id]}
                      onValueChange={(value) => handleActivityTypeChange(event.id, value as ActivityType)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Type d'activité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Réunion</SelectItem>
                        <SelectItem value="development">Développement</SelectItem>
                        <SelectItem value="testing">Tests</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!canImport || selectedEvents.size === 0 || isLoading}
            >
              {isLoading ? 'Importation...' : 'Importer la sélection'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
