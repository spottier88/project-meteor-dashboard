import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useRiskAccess } from "@/hooks/use-risk-access";

interface Risk {
  id: string;
  description: string;
  probability: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  mitigation_plan?: string;
  project_id: string;
}

interface RiskTableProps {
  risks: Risk[];
  projectId: string;
  onEdit?: (risk: Risk) => void;
  onDelete?: (risk: Risk) => void;
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

export const RiskTable = ({ risks, projectId, onEdit, onDelete }: RiskTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { canEditRisk, canDeleteRisk } = useRiskAccess(projectId);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedRisks = [...risks].sort((a: any, b: any) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            label="Description"
            sortKey="description"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Probabilité"
            sortKey="probability"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Gravité"
            sortKey="severity"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            label="Statut"
            sortKey="status"
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          {(canEditRisk || canDeleteRisk) && (
            <TableHead>Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRisks.map((risk) => (
          <TableRow key={risk.id}>
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
            {(canEditRisk || canDeleteRisk) && (
              <TableCell>
                <div className="flex items-center gap-2">
                  {canEditRisk && onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(risk)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteRisk && onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(risk)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};