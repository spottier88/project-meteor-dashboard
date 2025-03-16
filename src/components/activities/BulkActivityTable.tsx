
import React from 'react';
import { BulkActivityEntry } from '@/types/activity';
import { ActivityType } from '@/types/activity';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Copy, Trash2 } from "lucide-react";

interface BulkActivityTableProps {
  entries: BulkActivityEntry[];
  projects: { id: string; title: string }[];
  activityTypes: ActivityType[];
  updateEntry: (id: string, field: string, value: any) => void;
  removeEntry: (id: string) => void;
  duplicateEntry: (id: string) => void;
}

export const BulkActivityTable: React.FC<BulkActivityTableProps> = ({
  entries,
  projects,
  activityTypes,
  updateEntry,
  removeEntry,
  duplicateEntry
}) => {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projet</TableHead>
            <TableHead>Type d'activité</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Durée (min)</TableHead>
            <TableHead>Date et heure</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <Select
                  value={entry.project_id}
                  onValueChange={(value) => updateEntry(entry.id, 'project_id', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={entry.activity_type}
                  onValueChange={(value) => updateEntry(entry.id, 'activity_type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type d'activité" />
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
              <TableCell>
                <Input
                  type="text"
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                  placeholder="Description"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={entry.duration_minutes}
                  onChange={(e) => updateEntry(entry.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="datetime-local"
                  value={entry.start_time}
                  onChange={(e) => updateEntry(entry.id, 'start_time', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateEntry(entry.id)}
                    title="Dupliquer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(entry.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
