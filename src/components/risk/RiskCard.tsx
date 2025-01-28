import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskPermissions } from "@/hooks/use-risk-permissions";

interface RiskCardProps {
  risk: {
    id: string;
    description: string;
    probability: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved";
    project_id: string;
  };
  onEdit: (risk: any) => void;
  onDelete: (risk: any) => void;
}

const probabilityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const statusColors = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

export const RiskCard = ({ risk, onEdit, onDelete }: RiskCardProps) => {
  const { canManageRisks } = useRiskPermissions(risk.project_id);

  return (
    <TableRow>
      <TableCell>{risk.description}</TableCell>
      <TableCell>
        <Badge className={cn(probabilityColors[risk.probability])}>
          {risk.probability === "low" ? "Faible" : risk.probability === "medium" ? "Moyenne" : "Élevée"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn(severityColors[risk.severity])}>
          {risk.severity === "low" ? "Faible" : risk.severity === "medium" ? "Moyenne" : "Élevée"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn(statusColors[risk.status])}>
          {risk.status === "open" ? "Ouvert" : risk.status === "in_progress" ? "En cours" : "Résolu"}
        </Badge>
      </TableCell>
      {canManageRisks && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(risk)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(risk)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};