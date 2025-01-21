import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonitoringFilter } from "@/components/monitoring/MonitoringFilter";
import { LifecycleStatusFilter } from "@/components/project/LifecycleStatusFilter";
import { MyProjectsToggle } from "@/components/MyProjectsToggle";
import { AddFilteredToCartButton } from "@/components/cart/AddFilteredToCartButton";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus } from "@/types/project";

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  lifecycleStatus: ProjectLifecycleStatus | 'all';
  onLifecycleStatusChange: (status: ProjectLifecycleStatus | 'all') => void;
  monitoringLevel: MonitoringLevel | 'all';
  onMonitoringLevelChange: (level: MonitoringLevel | 'all') => void;
  showMyProjectsOnly: boolean;
  onMyProjectsToggle: (checked: boolean) => void;
  filteredProjectIds: string[];
}

export const ProjectFilters = ({
  searchQuery,
  onSearchChange,
  lifecycleStatus,
  onLifecycleStatusChange,
  monitoringLevel,
  onMonitoringLevelChange,
  showMyProjectsOnly,
  onMyProjectsToggle,
  filteredProjectIds,
}: ProjectFiltersProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-1/3">
          <Label htmlFor="search">Rechercher un projet ou un chef de projet</Label>
          <Input
            id="search"
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <LifecycleStatusFilter
            selectedStatus={lifecycleStatus}
            onStatusChange={onLifecycleStatusChange}
          />
          <MonitoringFilter
            selectedLevel={monitoringLevel}
            onLevelChange={onMonitoringLevelChange}
          />
          <MyProjectsToggle
            showMyProjectsOnly={showMyProjectsOnly}
            onToggle={onMyProjectsToggle}
          />
          <AddFilteredToCartButton 
            projectIds={filteredProjectIds}
          />
        </div>
      </div>
    </div>
  );
};