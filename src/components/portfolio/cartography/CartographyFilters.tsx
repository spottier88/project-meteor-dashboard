/**
 * @component CartographyFilters
 * @description Barre de filtres communs pour la cartographie du portefeuille :
 * direction, météo, cycle de vie et indicateur d'innovation.
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { lifecycleStatusLabels, ProjectLifecycleStatus, ProjectStatus } from "@/types/project";

export interface CartographyFilterState {
  directionId: string | "all";
  weather: ProjectStatus | "all";
  lifecycle: ProjectLifecycleStatus | "all";
  innovation: "all" | "innovative" | "non_innovative";
}

interface CartographyFiltersProps {
  filters: CartographyFilterState;
  onChange: (filters: CartographyFilterState) => void;
  directions: Array<{ id: string; name: string }>;
}

const WEATHER_LABELS: Record<ProjectStatus, string> = {
  sunny: "☀ Ensoleillé",
  cloudy: "☁ Nuageux",
  stormy: "⛈ Orageux",
};

export const defaultCartographyFilters: CartographyFilterState = {
  directionId: "all",
  weather: "all",
  lifecycle: "all",
  innovation: "all",
};

export const CartographyFilters = ({ filters, onChange, directions }: CartographyFiltersProps) => {
  const update = <K extends keyof CartographyFilterState>(key: K, value: CartographyFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilter =
    filters.directionId !== "all" ||
    filters.weather !== "all" ||
    filters.lifecycle !== "all" ||
    filters.innovation !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.directionId} onValueChange={(v) => update("directionId", v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les directions</SelectItem>
          {directions.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.weather} onValueChange={(v) => update("weather", v as ProjectStatus | "all")}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Météo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les météos</SelectItem>
          {(Object.keys(WEATHER_LABELS) as ProjectStatus[]).map((w) => (
            <SelectItem key={w} value={w}>
              {WEATHER_LABELS[w]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.lifecycle}
        onValueChange={(v) => update("lifecycle", v as ProjectLifecycleStatus | "all")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Cycle de vie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {(Object.keys(lifecycleStatusLabels) as ProjectLifecycleStatus[]).map((l) => (
            <SelectItem key={l} value={l}>
              {lifecycleStatusLabels[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.innovation}
        onValueChange={(v) => update("innovation", v as CartographyFilterState["innovation"])}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Innovation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="innovative">✨ Innovants</SelectItem>
          <SelectItem value="non_innovative">Non innovants</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={() => onChange(defaultCartographyFilters)}>
          <X className="h-4 w-4 mr-1" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
};
