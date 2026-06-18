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
  <div className="space-y-2 text-xs text-muted-foreground">
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-foreground">Cycle de vie (remplissage) :</span>
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
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-medium text-foreground">Météo (anneau extérieur) :</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border-[3px]" style={{ borderColor: WEATHER_COLORS.sunny }} />
          ☀ Ensoleillé
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border-[3px]" style={{ borderColor: WEATHER_COLORS.cloudy }} />
          ☁ Nuageux
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border-[3px]" style={{ borderColor: WEATHER_COLORS.stormy }} />
          ⛈ Orageux
        </span>
      </div>
    </div>
    <div className="text-[11px] italic">
      Rose des projets : axe vertical = priorité (haute en haut / standard en bas), axe horizontal = météo
      (saine à gauche / à risque à droite). Longueur du pétale = avancement du projet (0–100 %).
    </div>
  </div>
);
