
import { LayoutGrid, Table2, GanttChart } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table" | "gantt";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[]; // Nouvelle propriété pour spécifier les vues à afficher
}

export const ViewToggle = ({ 
  currentView, 
  onViewChange,
  availableViews = ["grid", "table", "gantt"] // Par défaut, affiche toutes les vues
}: ViewToggleProps) => {
  return (
    <div className="flex gap-2 mb-6">
      {availableViews.includes("grid") && (
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
      )}
      {availableViews.includes("table") && (
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
      )}
      {availableViews.includes("gantt") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewChange("gantt")}
          className={cn(
            "flex items-center gap-2",
            currentView === "gantt" && "bg-primary text-primary-foreground"
          )}
        >
          <GanttChart className="h-4 w-4" />
          Vue Gantt
        </Button>
      )}
    </div>
  );
};
