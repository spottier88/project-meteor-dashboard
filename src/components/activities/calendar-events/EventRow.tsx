
import React from 'react';
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import { ActivityType } from '@/types/activity';

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
  activityType?: string;
  projectId?: string;
  selected?: boolean;
}

interface EventRowProps {
  event: CalendarEvent;
  projects?: Project[];
  activityTypes: ActivityType[];
  onToggleSelection: (eventId: string) => void;
  onEventChange: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const EventRow: React.FC<EventRowProps> = ({
  event,
  projects,
  activityTypes,
  onToggleSelection,
  onEventChange,
}) => {
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
          <Textarea
            value={event.description || event.title || ''}
            onChange={(e) => onEventChange(event.id, { description: e.target.value })}
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
          value={event.projectId}
          onValueChange={(value) => onEventChange(event.id, { projectId: value })}
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
          onValueChange={(value) => onEventChange(event.id, { activityType: value })}
          disabled={!event.selected}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.id} value={type.code}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
};
