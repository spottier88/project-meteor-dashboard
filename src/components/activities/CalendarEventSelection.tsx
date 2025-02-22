
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
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

  const toggleEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleImport = () => {
    const eventsToImport = events.filter(event => selectedEvents.has(event.id));
    onImport(eventsToImport);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sélection des événements</CardTitle>
        <CardDescription>
          Sélectionnez les événements à importer comme activités
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
                <div className="flex-1">
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
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedEvents.size === 0 || isLoading}
            >
              {isLoading ? 'Importation...' : 'Importer la sélection'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
