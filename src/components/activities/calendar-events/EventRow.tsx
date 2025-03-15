
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
import { ActivityType, CalendarEvent } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Project {
  id: string;
  title: string;
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
            value={event.title || ''}
            onChange={(e) => onEventChange(event.id, { title: e.target.value })}
            disabled={!event.selected}
            placeholder="Titre de l'événement"
          />
          {event.projectCode && (
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-2">Code Projet: {event.projectCode}</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Code projet détecté dans la description</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
          onValueChange={(value) => onEventChange(event.id, { projectId: value })}
          disabled={!event.selected}
        >
          <SelectTrigger className={`w-[200px] ${event.projectCode ? 'border-green-500' : ''}`}>
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
