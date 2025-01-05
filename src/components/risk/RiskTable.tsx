import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Risk {
  id: string;
  description: string;
  probability: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  mitigation_plan?: string;
}

interface RiskTableProps {
  risks: Risk[];
  projectId: string;
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

export const RiskTable = ({ risks }: RiskTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Probabilité</TableHead>
          <TableHead>Gravité</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {risks.map((risk) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};