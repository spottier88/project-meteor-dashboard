import { Sun, Cloud, CloudLightning, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/project";

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
} as const;

interface StatusIconProps {
  status: ProjectStatus | null;
}

export const StatusIcon = ({ status }: StatusIconProps) => {
  if (!status) {
    return (
      <Hourglass
        className="w-6 h-6 text-muted-foreground"
        aria-label="En attente de revue"
      />
    );
  }
  
  const StatusIconComponent = statusIcons[status].icon;
  return (
    <StatusIconComponent
      className={cn("w-6 h-6", statusIcons[status].color)}
      aria-label={statusIcons[status].label}
    />
  );
};
