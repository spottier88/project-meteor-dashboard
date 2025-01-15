import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitoringLevel } from "@/types/monitoring";

interface MonitoringFilterProps {
  selectedLevel: MonitoringLevel | 'all';
  onLevelChange: (level: MonitoringLevel | 'all') => void;
}

export const MonitoringFilter = ({ selectedLevel, onLevelChange }: MonitoringFilterProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="monitoring-filter">Filtre de suivi</Label>
      <Select
        value={selectedLevel}
        onValueChange={(value) => onLevelChange(value as MonitoringLevel | 'all')}
      >
        <SelectTrigger id="monitoring-filter" className="w-[200px]">
          <SelectValue placeholder="Tous les projets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les projets</SelectItem>
          <SelectItem value="none">Non suivis</SelectItem>
          <SelectItem value="dgs">Suivi DGS</SelectItem>
          <SelectItem value="pole">Suivi Pôle</SelectItem>
          <SelectItem value="direction">Suivi Direction</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};