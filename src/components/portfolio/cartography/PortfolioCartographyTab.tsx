/**
 * @component PortfolioCartographyTab
 * @description Onglet "Cartographie" du portefeuille. Combine 3 visualisations
 * (matrice bubble, heatmap directions × cycle de vie, treemap par direction)
 * avec une barre de filtres commune et un export PNG.
 */
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/components/ui/use-toast";
import {
  buildCartographyProjects,
  useCartographyData,
} from "@/hooks/useCartographyData";
import {
  CartographyFilters,
  CartographyFilterState,
  defaultCartographyFilters,
} from "./CartographyFilters";
import { CartographyLegend } from "./CartographyLegend";
import { CartographyBubbleMatrix } from "./CartographyBubbleMatrix";
import { CartographyDirectionHeatmap } from "./CartographyDirectionHeatmap";
import { CartographyTreemap } from "./CartographyTreemap";

interface PortfolioCartographyTabProps {
  portfolioId: string;
  portfolioName: string;
  projects: Array<{
    id: string;
    title: string;
    project_manager: string | null;
    status: "sunny" | "cloudy" | "stormy" | null;
    lifecycle_status: "study" | "validated" | "in_progress" | "completed" | "suspended" | "abandoned";
    completion: number;
    last_review_date: string | null;
  }>;
}

export const PortfolioCartographyTab = ({
  portfolioId,
  portfolioName,
  projects,
}: PortfolioCartographyTabProps) => {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<CartographyFilterState>(defaultCartographyFilters);
  const [view, setView] = useState<"matrix" | "heatmap" | "treemap">("matrix");
  const [exporting, setExporting] = useState(false);

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const { data, isLoading } = useCartographyData(portfolioId, projectIds);

  const cartographyProjects = useMemo(() => {
    if (!data) return [];
    return buildCartographyProjects(projects, data.enrichmentByProject, data.directionMap);
  }, [projects, data]);

  const directionsList = useMemo(() => {
    const map = new Map<string, string>();
    cartographyProjects.forEach((p) => {
      if (p.direction_id && p.direction_name) map.set(p.direction_id, p.direction_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cartographyProjects]);

  const filtered = useMemo(() => {
    return cartographyProjects.filter((p) => {
      if (filters.directionId !== "all" && p.direction_id !== filters.directionId) return false;
      if (filters.weather !== "all" && p.weather !== filters.weather) return false;
      if (filters.lifecycle !== "all" && p.lifecycle_status !== filters.lifecycle) return false;
      if (filters.innovation === "innovative" && !p.is_innovative) return false;
      if (filters.innovation === "non_innovative" && p.is_innovative) return false;
      return true;
    });
  }, [cartographyProjects, filters]);

  const handleExport = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `cartographie-${portfolioName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${view}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Erreur export PNG:", e);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter la cartographie.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CartographyFilters filters={filters} onChange={setFilters} directions={directionsList} />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter en PNG
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} projet{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {cartographyProjects.length}
      </div>

      <Card>
        <CardContent className="p-4" ref={exportRef}>
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="matrix">Matrice</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap directions</TabsTrigger>
              <TabsTrigger value="treemap">Treemap</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="mt-4">
              <CartographyBubbleMatrix projects={filtered} />
            </TabsContent>
            <TabsContent value="heatmap" className="mt-4">
              <CartographyDirectionHeatmap projects={filtered} />
            </TabsContent>
            <TabsContent value="treemap" className="mt-4">
              <CartographyTreemap projects={filtered} />
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t">
            <CartographyLegend />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
