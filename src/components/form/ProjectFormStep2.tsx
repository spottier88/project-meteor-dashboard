
import React from "react";
import { DateInputField } from "./DateInputField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectFormStep2Props {
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  status: string | null;
  setStatus: (value: string | null) => void;
  priority: string | null;
  setPriority: (value: string | null) => void;
  project?: any;
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
  project
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DateInputField
              label="Date de début"
              date={startDate}
              onDateChange={setStartDate}
            />
          </div>
          <div>
            <DateInputField
              label="Date de fin"
              date={endDate}
              onDateChange={setEndDate}
              minDate={startDate}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select 
            value={status || ""} 
            onValueChange={(value) => setStatus(value || null)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunny">Bon déroulement</SelectItem>
              <SelectItem value="cloudy">Quelques difficultés</SelectItem>
              <SelectItem value="stormy">Difficultés majeures</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <Select 
            value={priority || ""} 
            onValueChange={(value) => setPriority(value || null)}
          >
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
