
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type ActivityType = Database['public']['Enums']['activity_type'];

interface Project {
  id: string;
  title: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: ActivityType;
  projectId?: string;
}

interface Props {
  events: CalendarEvent[];
  onImport: (events: CalendarEvent[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CalendarEventSelection = ({ events, onImport, onCancel, isLoading }: Props) => {
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>(events);

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_accessible_projects', { p_user_id: (await supabase.auth.getUser()).data.user?.id });

      if (error) throw error;
      return data as Project[];
    }
  });

  const activityTypes: ActivityType[] = [
    'meeting',
    'development',
    'testing',
    'documentation',
    'support',
    'other',
  ];

  const handleActivityTypeChange = (eventId: string, type: ActivityType) => {
    setSelectedEvents(events =>
      events.map(event =>
        event.id === eventId ? { ...event, activityType: type } : event
      )
    );
  };

  const handleProjectChange = (eventId: string, projectId: string) => {
    setSelectedEvents(events =>
      events.map(event =>
        event.id === eventId ? { ...event, projectId } : event
      )
    );
  };

  const canImport = selectedEvents.every(event => event.activityType && event.projectId);

  if (isLoadingProjects) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Type d'activité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedEvents.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>
                {format(event.startTime, 'dd/MM/yyyy HH:mm', { locale: fr })}
              </TableCell>
              <TableCell>{event.duration} min</TableCell>
              <TableCell>
                <Select
                  value={event.projectId}
                  onValueChange={(value) => handleProjectChange(event.id, value)}
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
                  value={event.activityType}
                  onValueChange={(value) => handleActivityTypeChange(event.id, value as ActivityType)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button 
          onClick={() => onImport(selectedEvents)} 
          disabled={!canImport || isLoading}
        >
          {isLoading ? 'Importation...' : 'Importer la sélection'}
        </Button>
      </div>
    </div>
  );
};

