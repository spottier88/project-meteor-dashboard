import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface ProjectFormStep2Props {
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  status: string;
  setStatus: (value: string) => void;
  priority: string;
  setPriority: (value: string) => void;
  project?: any; // Ajout de cette propriété manquante
}

export const ProjectFormStep2: React.FC<ProjectFormStep2Props> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  status,
  setStatus,
  priority,
  setPriority,
  project // Utilisation de la propriété ajoutée
}) => {
  
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Input
                id="start-date"
                placeholder="Choisir une date"
                readOnly
                value={startDate ? format(startDate, "PPP") : ""}
                className={cn(
                  "bg-white text-foreground shadow-sm",
                  !startDate && "text-muted-foreground"
                )}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={endDate ? (date) => date > endDate : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Input
                id="end-date"
                placeholder="Choisir une date"
                readOnly
                value={endDate ? format(endDate, "PPP") : ""}
                className={cn(
                  "bg-white text-foreground shadow-sm",
                  !endDate && "text-muted-foreground"
                )}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={startDate ? (date) => date < startDate : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="inProgress">En cours</SelectItem>
              <SelectItem value="onHold">En attente</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Sélectionner une priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
