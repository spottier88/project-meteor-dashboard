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
    <div className="space-y-6 mb-6 bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search Field */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Recherche
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Projet ou chef de projet..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Lifecycle Status Filter */}
        <div>
          <LifecycleStatusFilter
            selectedStatus={lifecycleStatus}
            onStatusChange={onLifecycleStatusChange}
          />
        </div>

        {/* Monitoring Level Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Niveau de suivi
          </Label>
          <MonitoringFilter
            selectedLevel={monitoringLevel}
            onLevelChange={onMonitoringLevelChange}
          />
        </div>

        {/* My Projects Toggle */}
        <div className="flex items-end">
          <MyProjectsToggle
            showMyProjectsOnly={showMyProjectsOnly}
            onToggle={onMyProjectsToggle}
          />
        </div>
      </div>

      {/* Add to Cart Button - Moved to bottom right */}
      <div className="flex justify-end mt-4">
        <AddFilteredToCartButton projectIds={filteredProjectIds} />
      </div>
    </div>
  );
};