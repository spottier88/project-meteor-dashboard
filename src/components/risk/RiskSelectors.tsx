import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowRight, ArrowUp, Circle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskProbability = "low" | "medium" | "high";
export type RiskSeverity = "low" | "medium" | "high";
export type RiskStatus = "open" | "in_progress" | "resolved";

interface RiskSelectorsProps {
  probability: RiskProbability;
  setProbability: (value: RiskProbability) => void;
  severity: RiskSeverity;
  setSeverity: (value: RiskSeverity) => void;
  status: RiskStatus;
  setStatus: (value: RiskStatus) => void;
}

const probabilityConfig = {
  low: { icon: ArrowDown, label: "Faible", color: "text-green-500" },
  medium: { icon: ArrowRight, label: "Moyenne", color: "text-yellow-500" },
  high: { icon: ArrowUp, label: "Élevée", color: "text-red-500" },
};

const severityConfig = {
  low: { icon: ArrowDown, label: "Faible", color: "text-green-500" },
  medium: { icon: ArrowRight, label: "Moyenne", color: "text-yellow-500" },
  high: { icon: ArrowUp, label: "Élevée", color: "text-red-500" },
};

const statusConfig = {
  open: { icon: AlertCircle, label: "Ouvert", color: "text-red-500" },
  in_progress: { icon: Circle, label: "En cours", color: "text-yellow-500" },
  resolved: { icon: CheckCircle2, label: "Résolu", color: "text-green-500" },
};

export const RiskSelectors = ({
  probability,
  setProbability,
  severity,
  setSeverity,
  status,
  setStatus,
}: RiskSelectorsProps) => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Probabilité</Label>
        <ToggleGroup
          type="single"
          value={probability}
          onValueChange={(value) => value && setProbability(value as RiskProbability)}
          className="justify-start"
        >
          {Object.entries(probabilityConfig).map(([key, { icon: Icon, label, color }]) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={label}
              className="data-[state=on]:bg-muted"
            >
              <Icon className={cn("w-4 h-4 mr-2", color)} />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label>Gravité</Label>
        <ToggleGroup
          type="single"
          value={severity}
          onValueChange={(value) => value && setSeverity(value as RiskSeverity)}
          className="justify-start"
        >
          {Object.entries(severityConfig).map(([key, { icon: Icon, label, color }]) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={label}
              className="data-[state=on]:bg-muted"
            >
              <Icon className={cn("w-4 h-4 mr-2", color)} />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label>Statut</Label>
        <RadioGroup
          value={status}
          onValueChange={(value) => setStatus(value as RiskStatus)}
          className="flex gap-4"
        >
          {Object.entries(statusConfig).map(([key, { icon: Icon, label, color }]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={key} id={`status-${key}`} />
              <Label
                htmlFor={`status-${key}`}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Icon className={cn("w-4 h-4", color)} />
                <span>{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};