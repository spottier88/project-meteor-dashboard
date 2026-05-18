/**
 * @component CartographyLegend
 * @description Légende partagée par toutes les visualisations de la cartographie.
 */
import { lifecycleStatusLabels, ProjectLifecycleStatus } from "@/types/project";

export const LIFECYCLE_COLORS: Record<ProjectLifecycleStatus, string> = {
  study: "#94a3b8",
  validated: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  suspended: "#f97316",
  abandoned: "#ef4444",
};

export const WEATHER_COLORS = {
  sunny: "#22c55e",
  cloudy: "#f59e0b",
  stormy: "#ef4444",
} as const;

export const CartographyLegend = () => (
  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
    <div className="flex items-center gap-2">
      <span className="font-medium text-foreground">Cycle de vie :</span>
      {(Object.keys(lifecycleStatusLabels) as ProjectLifecycleStatus[]).map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: LIFECYCLE_COLORS[s] }}
          />
          {lifecycleStatusLabels[s]}
        </span>
      ))}
    </div>
    <div className="flex items-center gap-3">
      <span className="font-medium text-foreground">Météo :</span>
      <span>☀ Ensoleillé</span>
      <span>☁ Nuageux</span>
      <span>⛈ Orageux</span>
    </div>
    <div className="flex items-center gap-1">
      <span className="font-medium text-foreground">✨</span>
      <span>Projet innovant (score moyen ≥ 3/5)</span>
    </div>
  </div>
);
