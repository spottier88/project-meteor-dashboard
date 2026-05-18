/**
 * @component CartographyDirectionHeatmap
 * @description Heatmap directions × cycle de vie. Chaque cellule affiche le nombre
 * de projets et est colorée selon la météo dominante. Clic = liste des projets.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CartographyProject } from "@/hooks/useCartographyData";
import { lifecycleStatusLabels, ProjectLifecycleStatus } from "@/types/project";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WEATHER_COLORS } from "./CartographyLegend";
import { resetInteractionLocks } from "@/utils/resetInteractionLocks";

interface CartographyDirectionHeatmapProps {
  projects: CartographyProject[];
}

const LIFECYCLES: ProjectLifecycleStatus[] = [
  "study",
  "validated",
  "in_progress",
  "completed",
  "suspended",
  "abandoned",
];

const NO_DIRECTION_KEY = "__none__";

export const CartographyDirectionHeatmap = ({ projects }: CartographyDirectionHeatmapProps) => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState<{
    directionName: string;
    lifecycle: ProjectLifecycleStatus;
    projects: CartographyProject[];
  } | null>(null);

  const { directions, grid } = useMemo(() => {
    const dirMap = new Map<string, string>();
    projects.forEach((p) => {
      const key = p.direction_id || NO_DIRECTION_KEY;
      const name = p.direction_name || "Sans direction";
      if (!dirMap.has(key)) dirMap.set(key, name);
    });
    const dirs = Array.from(dirMap.entries()).map(([id, name]) => ({ id, name }));

    const grid = new Map<string, CartographyProject[]>();
    projects.forEach((p) => {
      const key = `${p.direction_id || NO_DIRECTION_KEY}|${p.lifecycle_status}`;
      const list = grid.get(key) || [];
      list.push(p);
      grid.set(key, list);
    });
    return { directions: dirs, grid };
  }, [projects]);

  if (directions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucun projet à afficher.
      </div>
    );
  }

  const dominantWeather = (list: CartographyProject[]): keyof typeof WEATHER_COLORS | null => {
    const counts = { sunny: 0, cloudy: 0, stormy: 0 };
    list.forEach((p) => {
      if (p.weather) counts[p.weather]++;
    });
    const max = Math.max(counts.sunny, counts.cloudy, counts.stormy);
    if (max === 0) return null;
    if (counts.stormy === max) return "stormy";
    if (counts.cloudy === max) return "cloudy";
    return "sunny";
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 border-b font-medium">Direction</th>
              {LIFECYCLES.map((l) => (
                <th key={l} className="p-2 border-b text-xs font-medium text-center">
                  {lifecycleStatusLabels[l]}
                </th>
              ))}
              <th className="p-2 border-b text-xs font-medium text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {directions.map((d) => {
              const total = projects.filter(
                (p) => (p.direction_id || NO_DIRECTION_KEY) === d.id
              ).length;
              return (
                <tr key={d.id}>
                  <td className="p-2 border-b font-medium">{d.name}</td>
                  {LIFECYCLES.map((l) => {
                    const list = grid.get(`${d.id}|${l}`) || [];
                    const weather = dominantWeather(list);
                    const bg = weather ? WEATHER_COLORS[weather] : "transparent";
                    const opacity = list.length === 0 ? 0 : Math.min(1, 0.25 + list.length * 0.15);
                    return (
                      <td
                        key={l}
                        className="p-2 border-b text-center cursor-pointer hover:ring-2 hover:ring-primary transition"
                        style={{
                          backgroundColor: list.length > 0 ? `${bg}` : undefined,
                          opacity: list.length > 0 ? opacity : 1,
                          color: list.length > 2 ? "white" : undefined,
                        }}
                        onClick={() => {
                          if (list.length > 0) {
                            setSelectedCell({
                              directionName: d.name,
                              lifecycle: l,
                              projects: list,
                            });
                          }
                        }}
                      >
                        {list.length > 0 ? list.length : "—"}
                      </td>
                    );
                  })}
                  <td className="p-2 border-b text-center font-semibold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!selectedCell}
        onOpenChange={(o) => !o && setSelectedCell(null)}
      >
        <DialogContent
          onCloseAutoFocus={() => resetInteractionLocks()}
          onAnimationEnd={() => resetInteractionLocks()}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.directionName} · {selectedCell && lifecycleStatusLabels[selectedCell.lifecycle]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {selectedCell?.projects.map((p) => (
              <button
                key={p.id}
                className="w-full text-left p-2 rounded hover:bg-muted flex items-center justify-between"
                onClick={() => {
                  setSelectedCell(null);
                  navigate(`/projects/${p.id}`);
                }}
              >
                <span className="flex items-center gap-2">
                  {p.is_innovative && <span>✨</span>}
                  {p.title}
                </span>
                <span className="text-xs text-muted-foreground">{p.completion}%</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
