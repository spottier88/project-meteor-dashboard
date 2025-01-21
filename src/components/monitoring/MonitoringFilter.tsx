import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitoringLevel } from "@/types/monitoring";

interface MonitoringFilterProps {
  selectedLevel: MonitoringLevel | 'all';
  onLevelChange: (level: MonitoringLevel | 'all') => void;
}

export const MonitoringFilter = ({ selectedLevel, onLevelChange }: MonitoringFilterProps) => {
  return (
    <Select
      value={selectedLevel}
      onValueChange={(value) => onLevelChange(value as MonitoringLevel | 'all')}
    >
      <SelectTrigger className="w-full">
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
  );
};