
import { ChartGantt, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table" | "gantt";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn(
          "flex items-center gap-2",
          currentView === "grid" && "bg-primary text-primary-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Vue carte
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewChange("table")}
        className={cn(
          "flex items-center gap-2",
          currentView === "table" && "bg-primary text-primary-foreground"
        )}
      >
        <Table2 className="h-4 w-4" />
        Vue tableau
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewChange("gantt")}
        className={cn(
          "flex items-center gap-2",
          currentView === "gantt" && "bg-primary text-primary-foreground"
        )}
      >
        <ChartGantt className="h-4 w-4" />
        Vue planning
      </Button>
    </div>
  );
};
