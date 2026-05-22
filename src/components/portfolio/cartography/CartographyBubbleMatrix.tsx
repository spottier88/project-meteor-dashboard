/**
 * @component CartographyBubbleMatrix
 * @description Matrice bulles agrégée : chaque bulle représente un groupe de projets.
 * - Axe X : avancement moyen du groupe (0-100%)
 * - Axe Y : météo dominante du groupe (Orageux / Nuageux / Ensoleillé)
 * - Taille : nombre de projets (échelle racine carrée)
 * - Couleur : selon la dimension de regroupement
 * - Bordure violette : présence de projets innovants dans le groupe
 *
 * Un sélecteur « Regrouper par » permet de basculer entre Direction, Cycle de vie,
 * Pôle et "Aucun" (mode 1 bulle = 1 projet, conservé pour les power-users).
 * Au clic sur une bulle, ouvre un panneau latéral listant les projets du groupe.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { CartographyProject } from "@/hooks/useCartographyData";
import { LIFECYCLE_COLORS, WEATHER_COLORS } from "./CartographyLegend";
import { lifecycleStatusLabels, ProjectLifecycleStatus } from "@/types/project";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CartographyGroupDetailsSheet } from "./CartographyGroupDetailsSheet";

interface CartographyBubbleMatrixProps {
  projects: CartographyProject[];
}

type GroupBy = "direction" | "lifecycle" | "pole" | "none";

const WEATHER_Y: Record<string, number> = { stormy: 3, cloudy: 2, sunny: 1 };
const WEATHER_LABEL: Record<number, string> = { 1: "☀", 2: "☁", 3: "⛈" };
const Y_FROM_WEATHER = (w: string | null) => (w ? WEATHER_Y[w] : 2);

// Palette pour les directions / pôles (utilisée quand aucune couleur métier ne s'applique)
const FALLBACK_PALETTE = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

interface AggregatedBubble {
  key: string;
  label: string;
  color: string;
  x: number; // avancement moyen
  y: number; // météo dominante
  z: number; // nb projets
  count: number;
  innovativeCount: number;
  weatherBreakdown: { sunny: number; cloudy: number; stormy: number };
  projects: CartographyProject[];
}

const dominantWeather = (projects: CartographyProject[]): "sunny" | "cloudy" | "stormy" => {
  const tally = { sunny: 0, cloudy: 0, stormy: 0 };
  projects.forEach((p) => {
    if (p.weather) tally[p.weather] += 1;
  });
  let dom: "sunny" | "cloudy" | "stormy" = "cloudy";
  let max = -1;
  (Object.keys(tally) as Array<"sunny" | "cloudy" | "stormy">).forEach((k) => {
    if (tally[k] > max) {
      max = tally[k];
      dom = k;
    }
  });
  return dom;
};

const buildGroups = (projects: CartographyProject[], groupBy: GroupBy): AggregatedBubble[] => {
  const buckets = new Map<string, { label: string; projects: CartographyProject[] }>();
  projects.forEach((p) => {
    let key = "__unknown__";
    let label = "Non renseigné";
    if (groupBy === "direction") {
      key = p.direction_id || "__unknown__";
      label = p.direction_name || "Sans direction";
    } else if (groupBy === "lifecycle") {
      key = p.lifecycle_status;
      label = lifecycleStatusLabels[p.lifecycle_status];
    } else if (groupBy === "pole") {
      key = p.pole_id || "__unknown__";
      label = p.pole_name || "Sans pôle";
    }
    if (!buckets.has(key)) buckets.set(key, { label, projects: [] });
    buckets.get(key)!.projects.push(p);
  });

  const entries = Array.from(buckets.entries());
  return entries.map(([key, { label, projects: gp }], idx) => {
    const avgX = Math.round(gp.reduce((s, p) => s + p.completion, 0) / gp.length);
    const weather = dominantWeather(gp);
    const breakdown = { sunny: 0, cloudy: 0, stormy: 0 };
    gp.forEach((p) => p.weather && (breakdown[p.weather] += 1));
    const innov = gp.filter((p) => p.is_innovative).length;
    let color = FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
    if (groupBy === "lifecycle") color = LIFECYCLE_COLORS[key as ProjectLifecycleStatus] || color;
    return {
      key,
      label,
      color,
      x: avgX,
      y: WEATHER_Y[weather],
      z: gp.length, // valeur brute, ZAxis applique la mise à l'échelle
      count: gp.length,
      innovativeCount: innov,
      weatherBreakdown: breakdown,
      projects: gp,
    };
  });
};

const AggregatedTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: AggregatedBubble }> }) => {
  if (!active || !payload?.length) return null;
  const g = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-md p-3 text-xs space-y-1 max-w-xs">
      <div className="font-semibold">{g.label}</div>
      <div>Projets : <span className="font-medium">{g.count}</span></div>
      <div>Avancement moyen : <span className="font-medium">{g.x}%</span></div>
      <div className="flex gap-2 pt-1">
        <span style={{ color: WEATHER_COLORS.sunny }}>☀ {g.weatherBreakdown.sunny}</span>
        <span style={{ color: WEATHER_COLORS.cloudy }}>☁ {g.weatherBreakdown.cloudy}</span>
        <span style={{ color: WEATHER_COLORS.stormy }}>⛈ {g.weatherBreakdown.stormy}</span>
      </div>
      {g.innovativeCount > 0 && (
        <div className="text-purple-600 dark:text-purple-400">
          ✨ {g.innovativeCount} projet{g.innovativeCount > 1 ? "s" : ""} innovant{g.innovativeCount > 1 ? "s" : ""}
        </div>
      )}
      <div className="text-muted-foreground pt-1 italic">Cliquer pour voir le détail</div>
    </div>
  );
};

// Tooltip pour le mode "Aucun" (1 bulle = 1 projet)
const RawProjectTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { project: CartographyProject } }> }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload.project;
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-md p-3 text-xs space-y-1 max-w-xs">
      <div className="font-semibold flex items-center gap-1">
        {p.is_innovative && <span>✨</span>}
        {p.title}
      </div>
      {p.direction_name && <div className="text-muted-foreground">Direction : {p.direction_name}</div>}
      <div>Avancement : <span className="font-medium">{p.completion}%</span></div>
      <div>Statut : <span className="font-medium">{lifecycleStatusLabels[p.lifecycle_status]}</span></div>
    </div>
  );
};

export const CartographyBubbleMatrix = ({ projects }: CartographyBubbleMatrixProps) => {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupBy>("direction");
  const [selectedGroup, setSelectedGroup] = useState<AggregatedBubble | null>(null);

  const filtered = useMemo(() => projects.filter((p) => p.weather), [projects]);

  const aggregated = useMemo(
    () => (groupBy === "none" ? [] : buildGroups(filtered, groupBy)),
    [filtered, groupBy]
  );

  // Données en mode "Aucun" (1 bulle = 1 projet)
  const rawData = useMemo(
    () =>
      filtered.map((p) => ({
        x: p.completion,
        y: Y_FROM_WEATHER(p.weather),
        z: 1,
        project: p,
      })),
    [filtered]
  );

  // Échelle de taille : racine carrée du count, plage Recharts adaptée
  const maxCount = Math.max(1, ...aggregated.map((g) => g.count));
  const zRange: [number, number] =
    groupBy === "none" ? [120, 120] : [400, Math.max(800, Math.min(4000, maxCount * 200))];

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Aucun projet à afficher avec les filtres actuels.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Regrouper par :</span>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="direction">Direction</SelectItem>
            <SelectItem value="lifecycle">Cycle de vie</SelectItem>
            <SelectItem value="pole">Pôle</SelectItem>
            <SelectItem value="none">Aucun (1 bulle = 1 projet)</SelectItem>
          </SelectContent>
        </Select>
        {groupBy !== "none" && (
          <span className="text-xs text-muted-foreground">
            {aggregated.length} groupe{aggregated.length > 1 ? "s" : ""} ·{" "}
            {aggregated.reduce((s, g) => s + g.count, 0)} projets
          </span>
        )}
      </div>

      <div style={{ height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Avancement"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              label={{ value: "Avancement moyen", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Météo"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v) => WEATHER_LABEL[v] || ""}
              reversed
              label={{ value: "Météo dominante", angle: -90, position: "insideLeft" }}
            />
            <ZAxis type="number" dataKey="z" range={zRange} />
            <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <ReferenceLine y={2} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={groupBy === "none" ? <RawProjectTooltip /> : <AggregatedTooltip />}
            />
            {groupBy === "none" ? (
              <Scatter
                data={rawData}
                onClick={(d: { project: CartographyProject }) => void navigate(`/projects/${d.project.id}`)}
                cursor="pointer"
              >
                {rawData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={LIFECYCLE_COLORS[d.project.lifecycle_status] || "#94a3b8"}
                    stroke={d.project.is_innovative ? "#a855f7" : "hsl(var(--background))"}
                    strokeWidth={d.project.is_innovative ? 3 : 1}
                  />
                ))}
              </Scatter>
            ) : (
              <Scatter
                data={aggregated}
                onClick={(g: AggregatedBubble) => setSelectedGroup(g)}
                cursor="pointer"
              >
                {aggregated.map((g) => (
                  <Cell
                    key={g.key}
                    fill={g.color}
                    fillOpacity={0.75}
                    stroke={g.innovativeCount > 0 ? "#a855f7" : "hsl(var(--background))"}
                    strokeWidth={g.innovativeCount > 0 ? 3 : 1}
                  />
                ))}
              </Scatter>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        {groupBy === "none"
          ? "1 bulle = 1 projet · couleur = cycle de vie · bordure violette = projet innovant"
          : "Taille de la bulle = nombre de projets · position X = avancement moyen · Y = météo dominante · bordure violette = présence de projets innovants"}
      </div>

      <CartographyGroupDetailsSheet
        open={selectedGroup !== null}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
        groupLabel={selectedGroup?.label || ""}
        projects={selectedGroup?.projects || []}
      />
    </div>
  );
};
