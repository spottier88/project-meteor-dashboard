
// Composant de sélection visuelle du statut d'une tâche
// Affiche 3 boutons côte à côte représentant le flux de progression
import { Circle, Clock, CheckCircle2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface TaskStatusButtonsProps {
  status: "todo" | "in_progress" | "done";
  onStatusChange: (value: "todo" | "in_progress" | "done") => void;
  disabled?: boolean;
  readOnly?: boolean;
}

const statusConfig = [
  {
    value: "todo" as const,
    label: "À faire",
    icon: Circle,
    activeClass: "bg-gray-200 text-gray-800 border-gray-400",
  },
  {
    value: "in_progress" as const,
    label: "En cours",
    icon: Clock,
    activeClass: "bg-blue-100 text-blue-800 border-blue-400",
  },
  {
    value: "done" as const,
    label: "Terminé",
    icon: CheckCircle2,
    activeClass: "bg-green-100 text-green-800 border-green-400",
  },
];

export const TaskStatusButtons = ({
  status,
  onStatusChange,
  disabled = false,
  readOnly = false,
}: TaskStatusButtonsProps) => {
  const handleValueChange = (value: string) => {
    if (value && !disabled && !readOnly) {
      onStatusChange(value as "todo" | "in_progress" | "done");
    }
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Statut</label>
      <ToggleGroup
        type="single"
        value={status}
        onValueChange={handleValueChange}
        className="justify-start gap-2"
      >
        {statusConfig.map(({ value, label, icon: Icon, activeClass }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            disabled={disabled || readOnly}
            aria-label={label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium transition-all",
              "data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground data-[state=off]:border-transparent",
              status === value && activeClass,
              (disabled || readOnly) && "opacity-60 cursor-not-allowed"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
