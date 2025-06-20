import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectLifecycleStatus } from "@/types/project";
import { PoleDirectionServiceFilter } from "./PoleDirectionServiceFilter";
import { PortfolioFilter } from "./PortfolioFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MonitoringLevel } from "@/types/monitoring";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, X, Filter } from "lucide-react";

interface CollapsibleProjectFiltersProps {
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
  portfolioId?: string;
  onPortfolioChange?: (portfolioId: string) => void;
}

export const CollapsibleProjectFilters = ({
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
  portfolioId,
  onPortfolioChange,
}: CollapsibleProjectFiltersProps) => {
  // État pour l'ouverture/fermeture avec persistance localStorage
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("projectFiltersOpen") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("projectFiltersOpen", isOpen.toString());
  }, [isOpen]);

  const handleResetFilters = () => {
    onSearchChange("");
    onLifecycleStatusChange('all');
    onMonitoringLevelChange('all');
    onMyProjectsToggle(false);
    onPoleChange("all");
    onDirectionChange("all");
    onServiceChange("all");
    if (onPortfolioChange) {
      onPortfolioChange("all");
    }
  };

  // Convertir les valeurs undefined en "all" pour l'affichage
  const displayPoleId = poleId || "all";
  const displayDirectionId = directionId || "all";
  const displayServiceId = serviceId || "all";

  // Gestionnaires pour convertir "all" en undefined quand nécessaire
  const handlePoleFilterChange = (value: string | undefined) => {
    onPoleChange(value || "all");
  };

  const handleDirectionFilterChange = (value: string | undefined) => {
    onDirectionChange(value || "all");
  };

  const handleServiceFilterChange = (value: string | undefined) => {
    onServiceChange(value || "all");
  };

  // Fonction pour détecter les filtres actifs
  const getActiveFilters = () => {
    const active = [];
    
    if (searchQuery) {
      active.push({ key: 'search', label: `Recherche: "${searchQuery}"`, value: searchQuery });
    }
    
    if (lifecycleStatus !== 'all') {
      const statusLabels = {
        study: "À l'étude",
        validated: "Validé",
        in_progress: "En cours",
        completed: "Terminé",
        suspended: "Suspendu",
        abandoned: "Abandonné"
      };
      active.push({ 
        key: 'lifecycle', 
        label: `État: ${statusLabels[lifecycleStatus as keyof typeof statusLabels]}`, 
        value: lifecycleStatus 
      });
    }
    
    if (monitoringLevel !== 'all') {
      const levelLabels = {
        none: "Aucun suivi",
        low: "Faible",
        medium: "Moyen",
        high: "Élevé"
      };
      active.push({ 
        key: 'monitoring', 
        label: `Suivi: ${levelLabels[monitoringLevel as keyof typeof levelLabels]}`, 
        value: monitoringLevel 
      });
    }
    
    if (showMyProjectsOnly) {
      active.push({ key: 'myProjects', label: 'Mes projets uniquement', value: 'true' });
    }
    
    if (poleId !== 'all') {
      active.push({ key: 'pole', label: `Pôle sélectionné`, value: poleId });
    }
    
    if (directionId !== 'all') {
      active.push({ key: 'direction', label: `Direction sélectionnée`, value: directionId });
    }
    
    if (serviceId !== 'all') {
      active.push({ key: 'service', label: `Service sélectionné`, value: serviceId });
    }

    if (portfolioId && portfolioId !== 'all') {
      active.push({ key: 'portfolio', label: `Portefeuille sélectionné`, value: portfolioId });
    }
    
    return active;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  // Fonction pour supprimer un filtre individuel
  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'search':
        onSearchChange("");
        break;
      case 'lifecycle':
        onLifecycleStatusChange('all');
        break;
      case 'monitoring':
        onMonitoringLevelChange('all');
        break;
      case 'myProjects':
        onMyProjectsToggle(false);
        break;
      case 'pole':
        onPoleChange("all");
        break;
      case 'direction':
        onDirectionChange("all");
        break;
      case 'service':
        onServiceChange("all");
        break;
      case 'portfolio':
        if (onPortfolioChange) {
          onPortfolioChange("all");
        }
        break;
    }
  };

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-lg font-semibold">Filtres</span>
                {hasActiveFilters && (
                  <Badge variant="blue" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          {/* Affichage des badges des filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((filter) => (
                <Badge 
                  key={filter.key} 
                  variant="outline" 
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="text-xs">{filter.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFilter(filter.key);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Résumé compact quand fermé */}
          {!isOpen && hasActiveFilters && (
            <div className="text-sm text-muted-foreground mt-2">
              {activeFilters.length} filtre{activeFilters.length > 1 ? 's' : ''} actif{activeFilters.length > 1 ? 's' : ''}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="space-y-4 pt-0">
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
              selectedPoleId={displayPoleId === "all" ? undefined : displayPoleId}
              selectedDirectionId={displayDirectionId === "all" ? undefined : displayDirectionId}
              selectedServiceId={displayServiceId === "all" ? undefined : displayServiceId}
              onPoleChange={handlePoleFilterChange}
              onDirectionChange={handleDirectionFilterChange}
              onServiceChange={handleServiceFilterChange}
            />

            {onPortfolioChange && (
              <PortfolioFilter
                selectedPortfolioId={portfolioId}
                onPortfolioChange={(id) => onPortfolioChange(id || "all")}
              />
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetFilters} className="flex-1">
                Réinitialiser les filtres
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="px-3"
              >
                Fermer
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
