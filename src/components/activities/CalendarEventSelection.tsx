
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

export const CalendarEventSelection = ({ 
  events, 
  onImport, 
  onCancel, 
  isLoading,
  onToggleSelection,
  onToggleAllEvents,
}: Props) => {
  // État pour suivre les modifications des événements
  const [modifiedEvents, setModifiedEvents] = useState<{ [key: string]: CalendarEvent }>(
    Object.fromEntries(events.map(event => [event.id, event]))
  );

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_accessible_projects', { p_user_id: (await supabase.auth.getUser()).data.user?.id });

      if (error) throw error;
      return data as Project[];
    }
  });

  const activityTypes: { type: ActivityType; label: string }[] = [
    { type: 'meeting', label: 'Réunion' },
    { type: 'development', label: 'Développement' },
    { type: 'testing', label: 'Tests' },
    { type: 'documentation', label: 'Documentation' },
    { type: 'support', label: 'Support' },
    { type: 'other', label: 'Autre' },
  ];

  const handleEventChange = (eventId: string, updates: Partial<CalendarEvent>) => {
    setModifiedEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], ...updates }
    }));
  };

  const allEventsSelected = events.every(event => event.selected);
  const selectedCount = events.filter(event => event.selected).length;
  const selectedEvents = Object.values(modifiedEvents).filter(event => event.selected);
  
  // Mise à jour de la validation pour vérifier également les titres non vides
  const canImport = selectedEvents.length > 0 && selectedEvents.every(event => 
    event.activityType && 
    event.projectId && 
    event.title && 
    event.title.trim() !== ''
  );

  if (isLoadingProjects) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allEventsSelected}
                  onCheckedChange={(checked) => onToggleAllEvents?.(!!checked)}
                />
              </TableHead>
              <TableHead>Titre et description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Type d'activité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const modifiedEvent = modifiedEvents[event.id];
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <Checkbox
                      checked={event.selected}
                      onCheckedChange={() => onToggleSelection(event.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Input
                        value={modifiedEvent.title}
                        onChange={(e) => handleEventChange(event.id, { title: e.target.value })}
                        disabled={!event.selected}
                        placeholder="Titre de l'événement"
                      />
                      <Textarea
                        value={modifiedEvent.description || ''}
                        onChange={(e) => handleEventChange(event.id, { description: e.target.value })}
                        disabled={!event.selected}
                        placeholder="Description de l'événement"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(event.startTime, 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>{event.duration} min</TableCell>
                  <TableCell>
                    <Select
                      value={modifiedEvent.projectId}
                      onValueChange={(value) => handleEventChange(event.id, { projectId: value })}
                      disabled={!event.selected}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={modifiedEvent.activityType}
                      onValueChange={(value) => handleEventChange(event.id, { activityType: value as ActivityType })}
                      disabled={!event.selected}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map(({ type, label }) => (
                          <SelectItem key={type} value={type}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedCount} événement{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={() => onImport(Object.values(modifiedEvents))} 
            disabled={!canImport || isLoading || selectedCount === 0}
          >
            {isLoading ? 'Importation...' : `Importer ${selectedCount} événement${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
