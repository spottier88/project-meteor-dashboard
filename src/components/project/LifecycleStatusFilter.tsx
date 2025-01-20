import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";

interface LifecycleStatusFilterProps {
  selectedStatus: ProjectLifecycleStatus | 'all';
  onStatusChange: (status: ProjectLifecycleStatus | 'all') => void;
}

export const LifecycleStatusFilter = ({
  selectedStatus,
  onStatusChange,
}: LifecycleStatusFilterProps) => {
  return (
    <div className="space-y-2">
      <Label>Statut du projet</Label>
      <Select
        value={selectedStatus}
        onValueChange={(value) => onStatusChange(value as ProjectLifecycleStatus | 'all')}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sélectionner un statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {Object.entries(lifecycleStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};