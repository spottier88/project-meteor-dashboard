import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskCardProps {
  risk: {
    id: string;
    description: string;
    probability: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved";
    mitigation_plan?: string;
  };
  onEdit: (risk: any) => void;
  onDelete: (risk: any) => void;
  showActions: boolean;
}

const probabilityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

const severityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

const statusLabels = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const statusColors = {
  open: "text-red-500",
  in_progress: "text-yellow-500",
  resolved: "text-green-500",
};

const getImpactLevel = (probability: "low" | "medium" | "high", severity: "low" | "medium" | "high") => {
  const levels = { low: 1, medium: 2, high: 3 };
  const impact = levels[probability] * levels[severity];
  if (impact >= 6) return "Critique";
  if (impact >= 3) return "Important";
  return "Modéré";
};

const getImpactColor = (probability: "low" | "medium" | "high", severity: "low" | "medium" | "high") => {
  const impact = getImpactLevel(probability, severity);
  switch (impact) {
    case "Critique":
      return "text-red-500";
    case "Important":
      return "text-orange-500";
    default:
      return "text-yellow-500";
  }
};

export const RiskCard = ({ risk, onEdit, onDelete, showActions }: RiskCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{risk.description}</CardTitle>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(risk)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(risk)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Probabilité</p>
            <p className="font-medium">
              {probabilityLabels[risk.probability]}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gravité</p>
            <p className="font-medium">
              {severityLabels[risk.severity]}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Impact global</p>
            <p className={cn("font-medium", getImpactColor(risk.probability, risk.severity))}>
              {getImpactLevel(risk.probability, risk.severity)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            <p className={cn("font-medium", statusColors[risk.status])}>
              {statusLabels[risk.status]}
            </p>
          </div>
        </div>
        {risk.mitigation_plan && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Plan de mitigation</p>
            <p className="mt-1">{risk.mitigation_plan}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};