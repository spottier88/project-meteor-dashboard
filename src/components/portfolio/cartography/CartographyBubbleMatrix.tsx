/**
 * @component CartographyBubbleMatrix
 * @description Matrice bubble (scatter) : avancement (X) × météo inversée (Y),
 * couleur = cycle de vie, taille = ancienneté de la dernière revue,
 * halo ✨ si projet innovant. Au clic, navigation vers la fiche projet.
 */
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
import { LIFECYCLE_COLORS } from "./CartographyLegend";
import { lifecycleStatusLabels } from "@/types/project";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CartographyBubbleMatrixProps {
  projects: CartographyProject[];
}

const WEATHER_Y: Record<string, number> = { stormy: 3, cloudy: 2, sunny: 1 };
const WEATHER_LABEL: Record<number, string> = { 1: "☀", 2: "☁", 3: "⛈" };

interface ScatterDatum {
  x: number;
  y: number;
  z: number;
  project: CartographyProject;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDatum }> }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload.project;
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-md p-3 text-xs space-y-1 max-w-xs">
      <div className="font-semibold flex items-center gap-1">
        {p.is_innovative && <span>✨</span>}
        {p.title}
      </div>
      {p.direction_name && <div className="text-muted-foreground">Direction : {p.direction_name}</div>}
      {p.project_manager && <div className="text-muted-foreground">Chef de projet : {p.project_manager}</div>}
      <div>Avancement : <span className="font-medium">{p.completion}%</span></div>
      <div>Statut : <span className="font-medium">{lifecycleStatusLabels[p.lifecycle_status]}</span></div>
      <div>
        Dernière revue :{" "}
        <span className="font-medium">
          {p.last_review_date
            ? formatDistanceToNow(new Date(p.last_review_date), { addSuffix: true, locale: fr })
            : "Aucune"}
        </span>
      </div>
      {p.innovation_score > 0 && <div>Score innovation : {p.innovation_score.toFixed(1)}/5</div>}
    </div>
  );
};

export const CartographyBubbleMatrix = ({ projects }: CartographyBubbleMatrixProps) => {
  const navigate = useNavigate();
  const now = Date.now();

  const data: ScatterDatum[] = projects
    .filter((p) => p.weather)
    .map((p) => {
      const daysSinceReview = p.last_review_date
        ? Math.max(1, Math.round((now - new Date(p.last_review_date).getTime()) / 86_400_000))
        : 90;
      return {
        x: p.completion,
        y: WEATHER_Y[p.weather!] || 2,
        z: Math.min(500, 60 + daysSinceReview * 4),
        project: p,
      };
    });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Aucun projet à afficher avec les filtres actuels.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name="Avancement"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            label={{ value: "Avancement", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Météo"
            domain={[0.5, 3.5]}
            ticks={[1, 2, 3]}
            tickFormatter={(v) => WEATHER_LABEL[v] || ""}
            reversed
            label={{ value: "Météo", angle: -90, position: "insideLeft" }}
          />
          <ZAxis type="number" dataKey="z" range={[80, 600]} name="Ancienneté revue" />
          <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="4 4" />
          <ReferenceLine y={2} stroke="hsl(var(--border))" strokeDasharray="4 4" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
          <Scatter
            data={data}
            onClick={(d: ScatterDatum) => navigate(`/projects/${d.project.id}`)}
            cursor="pointer"
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={LIFECYCLE_COLORS[d.project.lifecycle_status] || "#94a3b8"}
                stroke={d.project.is_innovative ? "#a855f7" : "hsl(var(--background))"}
                strokeWidth={d.project.is_innovative ? 3 : 1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="text-xs text-muted-foreground text-center mt-2">
        Taille de la bulle = ancienneté de la dernière revue · Bordure violette = projet innovant
      </div>
    </div>
  );
};
