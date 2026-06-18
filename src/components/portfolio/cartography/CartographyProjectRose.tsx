/**
 * @component CartographyProjectRose
 * @description "Rose des projets" — visualisation polaire à 4 quadrants des projets
 * d'un portefeuille, inspirée des graphes de pilotage stratégique.
 *
 * Découpage :
 *   - axe vertical    : Priorité (Haute en haut / Standard en bas)
 *   - axe horizontal  : Météo (Saine = sunny+cloudy à gauche / À risque = stormy à droite)
 *
 * Chaque pétale = 1 projet :
 *   - largeur angulaire : 90° / (nb projets du quadrant)
 *   - rayon             : avancement (0-100 %)
 *   - remplissage       : couleur du statut cycle de vie
 *   - anneau extérieur  : couleur de la météo
 *   - numéro            : index dans la légende latérale
 */
import { useMemo, useState } from "react";
import { CartographyProject } from "@/hooks/useCartographyData";
import { lifecycleStatusLabels, ProjectLifecycleStatus } from "@/types/project";
import { LIFECYCLE_COLORS, WEATHER_COLORS } from "./CartographyLegend";

interface CartographyProjectRoseProps {
  projects: CartographyProject[];
}

type QuadrantKey = "haute-saine" | "haute-risque" | "standard-saine" | "standard-risque";

interface Petal {
  project: CartographyProject;
  index: number;        // numéro affiché (1..n)
  startAngle: number;   // radians
  endAngle: number;     // radians
  radius: number;       // px
  fill: string;
  stroke: string;
}

const SVG_SIZE = 600;
const CENTER = SVG_SIZE / 2;
const R_MAX = 240;
const R_MIN = 30; // rayon minimal pour qu'un projet à 0 % reste visible

// Quadrants en repère SVG (Y vers le bas) :
//   - 0 rad = droite (axe +X)
//   - sens horaire en SVG (rotation positive)
// Convention : on dessine en partant du nord-ouest et on tourne en sens horaire.
//   haut-gauche  : angles [180°, 270°]   = priorité haute / météo saine
//   haut-droite  : angles [270°, 360°]   = priorité haute / météo à risque
//   bas-droite   : angles [0°,  90°]     = priorité standard / météo à risque
//   bas-gauche   : angles [90°, 180°]    = priorité standard / météo saine
const QUADRANT_RANGES: Record<QuadrantKey, [number, number]> = {
  "haute-saine":    [Math.PI,           1.5 * Math.PI],
  "haute-risque":   [1.5 * Math.PI,     2 * Math.PI],
  "standard-risque":[0,                 0.5 * Math.PI],
  "standard-saine": [0.5 * Math.PI,     Math.PI],
};

/** Classe un projet dans l'un des 4 quadrants. */
const getQuadrant = (p: CartographyProject): QuadrantKey => {
  const isHaute = (p.priority || "").toLowerCase() === "high";
  const isRisque = p.weather === "stormy" || p.weather === null;
  if (isHaute && !isRisque) return "haute-saine";
  if (isHaute && isRisque) return "haute-risque";
  if (!isHaute && isRisque) return "standard-risque";
  return "standard-saine";
};

/** Convertit (angle, rayon) en coordonnées SVG. */
const polar = (angle: number, radius: number) => ({
  x: CENTER + Math.cos(angle) * radius,
  y: CENTER + Math.sin(angle) * radius,
});

/** Construit le path SVG d'un pétale (secteur angulaire). */
const buildSectorPath = (startAngle: number, endAngle: number, radius: number): string => {
  const p0 = polar(startAngle, 0);
  const p1 = polar(startAngle, radius);
  const p2 = polar(endAngle, radius);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
};

export const CartographyProjectRose = ({ projects }: CartographyProjectRoseProps) => {
  const [hovered, setHovered] = useState<{ petal: Petal; x: number; y: number } | null>(null);

  // Regroupement par quadrant + construction des pétales
  const { petals, byQuadrant } = useMemo(() => {
    const buckets: Record<QuadrantKey, CartographyProject[]> = {
      "haute-saine": [],
      "haute-risque": [],
      "standard-saine": [],
      "standard-risque": [],
    };
    projects.forEach((p) => buckets[getQuadrant(p)].push(p));

    let counter = 0;
    const all: Petal[] = [];
    (Object.keys(buckets) as QuadrantKey[]).forEach((key) => {
      const list = buckets[key];
      if (list.length === 0) return;
      const [a0, a1] = QUADRANT_RANGES[key];
      const width = (a1 - a0) / list.length;
      list.forEach((project, i) => {
        counter += 1;
        const start = a0 + i * width;
        const end = start + width;
        const ratio = Math.max(0, Math.min(100, project.completion)) / 100;
        const radius = R_MIN + ratio * (R_MAX - R_MIN);
        all.push({
          project,
          index: counter,
          startAngle: start,
          endAngle: end,
          radius,
          fill: LIFECYCLE_COLORS[project.lifecycle_status as ProjectLifecycleStatus] || "#94a3b8",
          stroke: project.weather ? WEATHER_COLORS[project.weather] : "#cbd5e1",
        });
      });
    });
    return { petals: all, byQuadrant: buckets };
  }, [projects]);

  // Cercles concentriques (grille polaire)
  const gridRadii = [0.25, 0.5, 0.75, 1].map((f) => R_MIN + f * (R_MAX - R_MIN));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Graphe SVG */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-auto"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Grille concentrique */}
          {gridRadii.map((r, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={1}
              strokeDasharray={i === gridRadii.length - 1 ? "0" : "2 3"}
            />
          ))}

          {/* Axes en pointillés */}
          <line
            x1={CENTER - R_MAX - 20}
            y1={CENTER}
            x2={CENTER + R_MAX + 20}
            y2={CENTER}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <line
            x1={CENTER}
            y1={CENTER - R_MAX - 20}
            x2={CENTER}
            y2={CENTER + R_MAX + 20}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Labels d'axes */}
          <text x={CENTER} y={22} textAnchor="middle" className="fill-foreground" fontSize={14} fontWeight={600}>
            Priorité haute
          </text>
          <text x={CENTER} y={SVG_SIZE - 8} textAnchor="middle" className="fill-foreground" fontSize={14} fontWeight={600}>
            Priorité standard
          </text>
          <text
            x={12}
            y={CENTER}
            textAnchor="start"
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize={13}
            fontWeight={600}
          >
            ☀ Météo saine
          </text>
          <text
            x={SVG_SIZE - 12}
            y={CENTER}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize={13}
            fontWeight={600}
          >
            ⛈ À risque
          </text>

          {/* Pétales */}
          {petals.map((petal) => {
            const mid = (petal.startAngle + petal.endAngle) / 2;
            const labelPos = polar(mid, petal.radius * 0.6);
            return (
              <g
                key={petal.project.id}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHovered({
                    petal,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <path
                  d={buildSectorPath(petal.startAngle, petal.endAngle, petal.radius)}
                  fill={petal.fill}
                  fillOpacity={0.78}
                  stroke={petal.stroke}
                  strokeWidth={4}
                  strokeLinejoin="round"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="#ffffff"
                  style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {petal.index}
                </text>
              </g>
            );
          })}

          {/* Messages "aucun projet" par quadrant vide */}
          {(Object.keys(byQuadrant) as QuadrantKey[]).map((key) => {
            if (byQuadrant[key].length > 0) return null;
            const [a0, a1] = QUADRANT_RANGES[key];
            const mid = (a0 + a1) / 2;
            const pos = polar(mid, R_MAX * 0.55);
            return (
              <text
                key={key}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                className="fill-muted-foreground"
                fontStyle="italic"
              >
                aucun projet
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute z-10 pointer-events-none rounded-md border bg-popover text-popover-foreground shadow-md p-3 text-xs max-w-[260px]"
            style={{
              left: Math.min(hovered.x + 12, SVG_SIZE - 270),
              top: Math.max(0, hovered.y - 10),
            }}
          >
            <div className="font-semibold text-sm mb-1">
              #{hovered.petal.index} — {hovered.petal.project.title}
            </div>
            <div className="space-y-0.5 text-muted-foreground">
              {hovered.petal.project.project_manager && (
                <div>Chef de projet : <span className="text-foreground">{hovered.petal.project.project_manager}</span></div>
              )}
              {hovered.petal.project.direction_name && (
                <div>Direction : <span className="text-foreground">{hovered.petal.project.direction_name}</span></div>
              )}
              <div>Avancement : <span className="text-foreground">{hovered.petal.project.completion}%</span></div>
              <div>
                Cycle de vie :{" "}
                <span className="text-foreground">
                  {lifecycleStatusLabels[hovered.petal.project.lifecycle_status as ProjectLifecycleStatus]}
                </span>
              </div>
              <div>
                Météo :{" "}
                <span className="text-foreground">
                  {hovered.petal.project.weather === "sunny"
                    ? "Ensoleillé"
                    : hovered.petal.project.weather === "cloudy"
                    ? "Nuageux"
                    : hovered.petal.project.weather === "stormy"
                    ? "Orageux"
                    : "Non défini"}
                </span>
              </div>
              <div>
                Priorité :{" "}
                <span className="text-foreground">
                  {(hovered.petal.project.priority || "").toLowerCase() === "high"
                    ? "Haute"
                    : (hovered.petal.project.priority || "").toLowerCase() === "medium"
                    ? "Moyenne"
                    : (hovered.petal.project.priority || "").toLowerCase() === "low"
                    ? "Basse"
                    : "Standard"}
                </span>
              </div>
              {hovered.petal.project.last_review_date && (
                <div>
                  Dernière revue :{" "}
                  <span className="text-foreground">
                    {new Date(hovered.petal.project.last_review_date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Légende numérotée latérale */}
      <div className="border rounded-md p-3 bg-card max-h-[600px] overflow-y-auto">
        <div className="text-sm font-semibold mb-2">Projets ({petals.length})</div>
        {petals.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">Aucun projet à afficher.</div>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {petals.map((p) => (
              <li key={p.project.id} className="flex items-start gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: p.fill, border: `2px solid ${p.stroke}` }}
                >
                  {p.index}
                </span>
                <span className="leading-tight">{p.project.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
