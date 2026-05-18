/**
 * @component CartographyTreemap
 * @description Treemap regroupant les projets par direction. La taille de chaque
 * rectangle est proportionnelle au nombre de projets ; la couleur reflète la météo.
 */
import { useNavigate } from "react-router";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { CartographyProject } from "@/hooks/useCartographyData";
import { WEATHER_COLORS } from "./CartographyLegend";

interface CartographyTreemapProps {
  projects: CartographyProject[];
}

interface TreemapLeaf {
  name: string;
  size: number;
  projectId: string;
  weather: "sunny" | "cloudy" | "stormy" | null;
  innovative: boolean;
  completion: number;
}

interface TreemapNode {
  name: string;
  children: TreemapLeaf[];
}

const TreemapContent = (props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: TreemapLeaf;
  depth?: number;
  root?: { children?: TreemapNode[] };
  index?: number;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, payload, depth = 0, root, index = 0 } = props;
  // Niveau groupe (direction) : on dessine juste un cadre + titre
  if (depth === 1) {
    const groupName = root?.children?.[index]?.name || "";
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
        {width > 60 && height > 20 && (
          <text x={x + 4} y={y + 14} fill="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600}>
            {groupName}
          </text>
        )}
      </g>
    );
  }
  const leaf = payload;
  if (!leaf) return null;
  const fill = leaf.weather ? WEATHER_COLORS[leaf.weather] : "#cbd5e1";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={leaf.innovative ? "#a855f7" : "hsl(var(--background))"}
        strokeWidth={leaf.innovative ? 3 : 1}
        style={{ cursor: "pointer" }}
      />
      {width > 70 && height > 30 && (
        <text x={x + 6} y={y + 16} fill="white" fontSize={11} fontWeight={500}>
          {leaf.innovative ? "✨ " : ""}
          {leaf.name.length > 22 ? leaf.name.slice(0, 22) + "…" : leaf.name}
        </text>
      )}
      {width > 70 && height > 50 && (
        <text x={x + 6} y={y + 32} fill="white" fontSize={10}>
          {leaf.completion}%
        </text>
      )}
    </g>
  );
};

export const CartographyTreemap = ({ projects }: CartographyTreemapProps) => {
  const navigate = useNavigate();

  const groups = new Map<string, CartographyProject[]>();
  projects.forEach((p) => {
    const key = p.direction_name || "Sans direction";
    const list = groups.get(key) || [];
    list.push(p);
    groups.set(key, list);
  });

  const data: TreemapNode[] = Array.from(groups.entries()).map(([name, list]) => ({
    name,
    children: list.map<TreemapLeaf>((p) => ({
      name: p.title,
      size: 1,
      projectId: p.id,
      weather: p.weather,
      innovative: p.is_innovative,
      completion: p.completion,
    })),
  }));

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Aucun projet à afficher.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          stroke="hsl(var(--background))"
          content={<TreemapContent />}
          onClick={(node: { projectId?: string }) => {
            if (node?.projectId) navigate(`/projects/${node.projectId}`);
          }}
        >
          <Tooltip
            content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: TreemapLeaf }> }) => {
              if (!active || !payload?.length) return null;
              const leaf = payload[0].payload;
              if (!leaf?.name) return null;
              return (
                <div className="rounded-md border bg-popover text-popover-foreground shadow-md p-2 text-xs">
                  <div className="font-semibold">
                    {leaf.innovative ? "✨ " : ""}
                    {leaf.name}
                  </div>
                  <div>Avancement : {leaf.completion}%</div>
                </div>
              );
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
