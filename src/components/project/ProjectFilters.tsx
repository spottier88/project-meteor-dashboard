import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { PoleDirectionServiceFilter } from "./PoleDirectionServiceFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { PortfolioFilter } from "./PortfolioFilter";

export interface ProjectFiltersState {
  status?: ProjectStatus;
  progress?: ProgressStatus;
  lifecycleStatus?: ProjectLifecycleStatus;
  suivi_dgs?: boolean;
  selectedPoleId?: string;
  selectedDirectionId?: string;
  selectedServiceId?: string;
  portfolioId?: string;
}

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onFiltersChange: (filters: ProjectFiltersState) => void;
  showMyProjects: boolean;
  onShowMyProjectsChange: (show: boolean) => void;
}

export const ProjectFilters = ({
  filters,
  onFiltersChange,
  showMyProjects,
  onShowMyProjectsChange,
}: ProjectFiltersProps) => {
  const handleStatusChange = (status: ProjectStatus | undefined) => {
    onFiltersChange({ ...filters, status });
  };

  const handleProgressChange = (progress: ProgressStatus | undefined) => {
    onFiltersChange({ ...filters, progress });
  };

  const handleLifecycleStatusChange = (lifecycleStatus: ProjectLifecycleStatus | undefined) => {
    onFiltersChange({ ...filters, lifecycleStatus });
  };

  const handleSuiviDGSChange = (checked: boolean) => {
    onFiltersChange({ ...filters, suivi_dgs: checked });
  };

  const handlePoleChange = (poleId: string | undefined) => {
    onFiltersChange({
      ...filters,
      selectedPoleId: poleId,
      selectedDirectionId: undefined,
      selectedServiceId: undefined,
    });
  };

  const handleDirectionChange = (directionId: string | undefined) => {
    onFiltersChange({
      ...filters,
      selectedDirectionId: directionId,
      selectedServiceId: undefined,
    });
  };

  const handleServiceChange = (serviceId: string | undefined) => {
    onFiltersChange({ ...filters, selectedServiceId: serviceId });
  };

  useEffect(() => {
    // Reset direction and service when pole changes
    if (!filters.selectedPoleId) {
      onFiltersChange({ ...filters, selectedDirectionId: undefined, selectedServiceId: undefined });
    }
    // Reset service when direction changes
    if (!filters.selectedDirectionId) {
      onFiltersChange({ ...filters, selectedServiceId: undefined });
    }
  }, [filters.selectedPoleId, filters.selectedDirectionId, onFiltersChange, filters]);

  const handlePortfolioChange = (portfolioId: string | undefined) => {
    onFiltersChange({ ...filters, portfolioId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={filters.status || ""} onValueChange={(value) => handleStatusChange(value as ProjectStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="sunny">Ensoleillé</SelectItem>
                <SelectItem value="cloudy">Nuageux</SelectItem>
                <SelectItem value="stormy">Orageux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="progress">Progrès</Label>
            <Select value={filters.progress || ""} onValueChange={(value) => handleProgressChange(value as ProgressStatus)}>
              <SelectTrigger id="progress">
                <SelectValue placeholder="Tous les progrès" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les progrès</SelectItem>
                <SelectItem value="better">Amélioration</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="worse">Détérioration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lifecycleStatus">État du cycle de vie</Label>
            <Select value={filters.lifecycleStatus || ""} onValueChange={(value) => handleLifecycleStatusChange(value as ProjectLifecycleStatus)}>
              <SelectTrigger id="lifecycleStatus">
                <SelectValue placeholder="Tous les états" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les états</SelectItem>
                <SelectItem value="study">À l'étude</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="abandoned">Abandonné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="suivi_dgs"
              checked={filters.suivi_dgs || false}
              onCheckedChange={(checked) => handleSuiviDGSChange(!!checked)}
            />
            <Label htmlFor="suivi_dgs" className="text-sm font-normal">
              Suivi DGS
            </Label>
          </div>
        </div>

        <PoleDirectionServiceFilter
          selectedPoleId={filters.selectedPoleId}
          selectedDirectionId={filters.selectedDirectionId}
          selectedServiceId={filters.selectedServiceId}
          onPoleChange={handlePoleChange}
          onDirectionChange={handleDirectionChange}
          onServiceChange={handleServiceChange}
        />
        
        <PortfolioFilter
          selectedPortfolioId={filters.portfolioId}
          onPortfolioChange={handlePortfolioChange}
        />

        <Button variant="outline" onClick={() => onFiltersChange({})} className="w-full">
          Réinitialiser les filtres
        </Button>
      </CardContent>
    </Card>
  );
};
