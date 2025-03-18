
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MonitoringFilter } from "@/components/monitoring/MonitoringFilter";
import { LifecycleStatusFilter } from "@/components/project/LifecycleStatusFilter";
import { MyProjectsToggle } from "@/components/MyProjectsToggle";
import { AddFilteredToCartButton } from "@/components/cart/AddFilteredToCartButton";
import { OrganizationFilters } from "@/components/project/OrganizationFilters";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { RotateCcw, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  poleId: string;
  onPoleChange: (value: string) => void;
  directionId: string;
  onDirectionChange: (value: string) => void;
  serviceId: string;
  onServiceChange: (value: string) => void;
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
  poleId,
  onPoleChange,
  directionId,
  onDirectionChange,
  serviceId,
  onServiceChange,
}: ProjectFiltersProps) => {
  // État pour savoir si le panneau de filtres est ouvert ou fermé
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("filtersOpen") === "true" || false;
  });

  // Sauvegarde de l'état d'ouverture dans localStorage
  useEffect(() => {
    localStorage.setItem("filtersOpen", isOpen.toString());
  }, [isOpen]);

  const handleResetFilters = () => {
    onSearchChange('');
    onLifecycleStatusChange('all');
    onMonitoringLevelChange('all');
    onMyProjectsToggle(false);
    onPoleChange('all');
    onDirectionChange('all');
    onServiceChange('all');
  };

  // Compte le nombre de filtres actifs
  const activeFiltersCount = [
    searchQuery !== '',
    lifecycleStatus !== 'all',
    monitoringLevel !== 'all',
    showMyProjectsOnly,
    poleId !== 'all',
    directionId !== 'all',
    serviceId !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-8">
                <Filter className="h-4 w-4" />
                Filtres
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 opacity-50" />
                ) : (
                  <ChevronDown className="h-3 w-3 opacity-50" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            {/* Affichage des filtres actifs sous forme de badges */}
            <div className="flex flex-wrap gap-1 ml-2">
              {activeFiltersCount > 0 ? (
                <>
                  {searchQuery && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Recherche: {searchQuery}
                    </Badge>
                  )}
                  {lifecycleStatus !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Statut: {lifecycleStatusLabels[lifecycleStatus]}
                    </Badge>
                  )}
                  {monitoringLevel !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Suivi: {monitoringLevel === 'none' ? 'Non suivi' : monitoringLevel}
                    </Badge>
                  )}
                  {showMyProjectsOnly && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Mes projets
                    </Badge>
                  )}
                  {poleId !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Pôle: {poleId === 'none' ? 'Aucun' : 'Sélectionné'}
                    </Badge>
                  )}
                  {directionId !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Direction: {directionId === 'none' ? 'Aucune' : 'Sélectionnée'}
                    </Badge>
                  )}
                  {serviceId !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Service: {serviceId === 'none' ? 'Aucun' : 'Sélectionné'}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Aucun filtre actif</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
            <AddFilteredToCartButton projectIds={filteredProjectIds} className="h-8" />
          </div>
        </div>
        
        <CollapsibleContent className={cn(
          "space-y-6 bg-gray-50 p-4 rounded-b-lg border-x border-b border-gray-200",
          !isOpen && "rounded-none"
        )}>
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

          {/* Filtres organisationnels */}
          <div className="pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium mb-2 block">
              Filtres organisationnels
            </Label>
            <OrganizationFilters
              poleId={poleId}
              setPoleId={onPoleChange}
              directionId={directionId}
              setDirectionId={onDirectionChange}
              serviceId={serviceId}
              setServiceId={onServiceChange}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
