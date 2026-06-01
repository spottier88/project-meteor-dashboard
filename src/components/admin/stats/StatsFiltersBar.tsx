/**
 * @component StatsFiltersBar
 * @description Barre de filtres commune aux pages de statistiques admin.
 * Combine sélecteur de période, filtres organisationnels et bouton d'export.
 */
import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminStatsFilters, PeriodPreset } from "@/hooks/admin-stats/useAdminStatsFilters";
import { useOrgOptions } from "@/hooks/admin-stats/useOrgOptions";

interface StatsFiltersBarProps {
  filters: AdminStatsFilters;
  showPeriod?: boolean;
  setPeriod: (p: PeriodPreset) => void;
  setCustomRange: (start: string, end: string) => void;
  setOrg: (poleId: string | null, directionId: string | null, serviceId: string | null) => void;
  onExport: () => void;
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  year: "Année écoulée",
  custom: "Personnalisé",
};

export const StatsFiltersBar = ({
  filters,
  showPeriod = true,
  setPeriod,
  setCustomRange,
  setOrg,
  onExport,
}: StatsFiltersBarProps) => {
  const { data: org } = useOrgOptions();

  const filteredDirections = useMemo(
    () => (filters.poleId ? org?.directions.filter((d) => d.pole_id === filters.poleId) ?? [] : []),
    [org, filters.poleId]
  );
  const filteredServices = useMemo(
    () => (filters.directionId ? org?.services.filter((s) => s.direction_id === filters.directionId) ?? [] : []),
    [org, filters.directionId]
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      {showPeriod && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Période</label>
            <Select value={filters.period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.period === "custom" && (
            <>
              <DateField
                label="Du"
                value={filters.startDate}
                onChange={(d) => setCustomRange(d, filters.endDate)}
              />
              <DateField
                label="Au"
                value={filters.endDate}
                onChange={(d) => setCustomRange(filters.startDate, d)}
              />
            </>
          )}
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Pôle</label>
        <Select
          value={filters.poleId ?? "all"}
          onValueChange={(v) => setOrg(v === "all" ? null : v, null, null)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pôles</SelectItem>
            {org?.poles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Direction</label>
        <Select
          value={filters.directionId ?? "all"}
          onValueChange={(v) => setOrg(filters.poleId, v === "all" ? null : v, null)}
          disabled={!filters.poleId}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {filteredDirections.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Service</label>
        <Select
          value={filters.serviceId ?? "all"}
          onValueChange={(v) => setOrg(filters.poleId, filters.directionId, v === "all" ? null : v)}
          disabled={!filters.directionId}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {filteredServices.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto">
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>
    </div>
  );
};

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-muted-foreground">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-40 justify-start text-left font-normal")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(new Date(value), "PPP", { locale: fr })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={new Date(value)}
          onSelect={(d) => d && onChange(d.toISOString())}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);
