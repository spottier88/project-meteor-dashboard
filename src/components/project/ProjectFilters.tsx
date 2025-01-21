import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MonitoringFilter } from "@/components/monitoring/MonitoringFilter";
import { LifecycleStatusFilter } from "@/components/project/LifecycleStatusFilter";
import { MyProjectsToggle } from "@/components/MyProjectsToggle";
import { AddFilteredToCartButton } from "@/components/cart/AddFilteredToCartButton";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus } from "@/types/project";
import { RotateCcw } from "lucide-react";

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

  const handleResetFilters = () => {
    onSearchChange('');
    onLifecycleStatusChange('all');
    onMonitoringLevelChange('all');
    onMyProjectsToggle(false);
  };

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

      {/* Reset and Cart Buttons */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={handleResetFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser les filtres
        </Button>
        <AddFilteredToCartButton projectIds={filteredProjectIds} />
      </div>
    </div>
  );
};