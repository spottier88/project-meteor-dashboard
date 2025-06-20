
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { PoleDirectionServiceFilter } from "./PoleDirectionServiceFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortfolioFilter } from "./PortfolioFilter";
import { MonitoringLevel } from "@/types/monitoring";

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lifecycleStatus: ProjectLifecycleStatus | 'all';
  onLifecycleStatusChange: (status: ProjectLifecycleStatus | 'all') => void;
  monitoringLevel: MonitoringLevel | 'all';
  onMonitoringLevelChange: (level: MonitoringLevel | 'all') => void;
  showMyProjectsOnly: boolean;
  onMyProjectsToggle: (show: boolean) => void;
  filteredProjectIds: string[];
  poleId: string;
  onPoleChange: (poleId: string) => void;
  directionId: string;
  onDirectionChange: (directionId: string) => void;
  serviceId: string;
  onServiceChange: (serviceId: string) => void;
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
  poleId,
  onPoleChange,
  directionId,
  onDirectionChange,
  serviceId,
  onServiceChange,
}: ProjectFiltersProps) => {
  const handleResetFilters = () => {
    onSearchChange("");
    onLifecycleStatusChange('all');
    onMonitoringLevelChange('all');
    onMyProjectsToggle(false);
    onPoleChange("all");
    onDirectionChange("all");
    onServiceChange("all");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Recherche</Label>
          <Input
            id="search"
            placeholder="Rechercher par nom ou responsable..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lifecycleStatus">État du cycle de vie</Label>
            <Select value={lifecycleStatus} onValueChange={onLifecycleStatusChange}>
              <SelectTrigger id="lifecycleStatus">
                <SelectValue placeholder="Tous les états" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="study">À l'étude</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="abandoned">Abandonné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="monitoringLevel">Niveau de suivi</Label>
            <Select value={monitoringLevel} onValueChange={onMonitoringLevelChange}>
              <SelectTrigger id="monitoringLevel">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="none">Aucun suivi</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="myProjects"
            checked={showMyProjectsOnly}
            onCheckedChange={onMyProjectsToggle}
          />
          <Label htmlFor="myProjects" className="text-sm font-normal">
            Mes projets uniquement
          </Label>
        </div>

        <PoleDirectionServiceFilter
          selectedPoleId={poleId === "all" ? undefined : poleId}
          selectedDirectionId={directionId === "all" ? undefined : directionId}
          selectedServiceId={serviceId === "all" ? undefined : serviceId}
          onPoleChange={(id) => onPoleChange(id || "all")}
          onDirectionChange={(id) => onDirectionChange(id || "all")}
          onServiceChange={(id) => onServiceChange(id || "all")}
        />

        <Button variant="outline" onClick={handleResetFilters} className="w-full">
          Réinitialiser les filtres
        </Button>
      </CardContent>
    </Card>
  );
};
