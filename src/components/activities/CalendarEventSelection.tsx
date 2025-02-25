
import React from 'react';
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
}

export const CalendarEventSelection = ({ 
  events, 
  onImport, 
  onCancel, 
  isLoading,
  onToggleSelection,
}: Props) => {
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

  const handleActivityTypeChange = (eventId: string, type: ActivityType) => {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].activityType = type;
    }
  };

  const handleProjectChange = (eventId: string, projectId: string) => {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].projectId = projectId;
    }
  };

  const selectedEvents = events.filter(event => event.selected);
  
  const canImport = selectedEvents.length > 0 && selectedEvents.every(event => 
    event.activityType && event.projectId
  );

  const selectedCount = selectedEvents.length;

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
            <TableHead className="w-[50px]">
              <span className="sr-only">Sélection</span>
            </TableHead>
            <TableHead>Titre et description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Type d'activité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <Checkbox
                  checked={event.selected}
                  onCheckedChange={() => onToggleSelection(event.id)}
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground">{event.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {format(event.startTime, 'dd/MM/yyyy HH:mm', { locale: fr })}
              </TableCell>
              <TableCell>{event.duration} min</TableCell>
              <TableCell>
                <Select
                  value={event.projectId}
                  onValueChange={(value) => handleProjectChange(event.id, value)}
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
                  value={event.activityType}
                  onValueChange={(value) => handleActivityTypeChange(event.id, value as ActivityType)}
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
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedCount} événement{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={() => onImport(events)} 
            disabled={!canImport || isLoading || selectedCount === 0}
          >
            {isLoading ? 'Importation...' : `Importer ${selectedCount} événement${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
