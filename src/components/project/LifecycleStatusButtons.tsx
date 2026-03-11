
/**
 * @component LifecycleStatusButtons
 * @description Sélecteur visuel du statut du cycle de vie d'un projet.
 * Affiche des boutons toggle colorés avec icônes, similaire à TaskStatusButtons.
 * Le statut "Terminé" est exclu (processus de clôture obligatoire).
 */

import { Search, CheckCircle, Play, Pause, XCircle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectLifecycleStatus } from "@/types/project";
import { cn } from "@/lib/utils";

interface LifecycleStatusButtonsProps {
  status: ProjectLifecycleStatus;
  onStatusChange: (value: ProjectLifecycleStatus) => void;
  disabled?: boolean;
}

const statusConfig = [
  {
    value: "study" as const,
    label: "À l'étude",
    icon: Search,
    activeClass: "bg-gray-200 text-gray-800 border-gray-400",
  },
  {
    value: "validated" as const,
    label: "Validé",
    icon: CheckCircle,
    activeClass: "bg-blue-100 text-blue-800 border-blue-400",
  },
  {
    value: "in_progress" as const,
    label: "En cours",
    icon: Play,
    activeClass: "bg-green-100 text-green-800 border-green-400",
  },
  {
    value: "suspended" as const,
    label: "Suspendu",
    icon: Pause,
    activeClass: "bg-orange-100 text-orange-800 border-orange-400",
  },
  {
    value: "abandoned" as const,
    label: "Abandonné",
    icon: XCircle,
    activeClass: "bg-red-100 text-red-800 border-red-400",
  },
];

export const LifecycleStatusButtons = ({
  status,
  onStatusChange,
  disabled = false,
}: LifecycleStatusButtonsProps) => {
  const handleValueChange = (value: string) => {
    if (value && !disabled) {
      onStatusChange(value as ProjectLifecycleStatus);
    }
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Statut</label>
      <ToggleGroup
        type="single"
        value={status}
        onValueChange={handleValueChange}
        className="justify-start gap-2 flex-wrap"
      >
        {statusConfig.map(({ value, label, icon: Icon, activeClass }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            disabled={disabled}
            aria-label={label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium transition-all",
              "data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground data-[state=off]:border-transparent",
              status === value && activeClass,
              disabled && "opacity-60 cursor-not-allowed"
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
