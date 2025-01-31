import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RiskListProps {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
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

export const RiskList = ({
  projectId,
  projectTitle,
  canEdit,
  isProjectManager,
  isAdmin,
}: RiskListProps) => {
  const { data: risks, isLoading, isError } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Erreur lors du chargement des risques.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Risques du projet</h2>
        {canEdit && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau risque
          </Button>
        )}
      </div>

      {risks && risks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Probabilité</TableHead>
              <TableHead>Gravité</TableHead>
              <TableHead>Statut</TableHead>
              {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
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
                {canEdit && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Aucun risque trouvé pour ce projet.</p>
      )}
    </div>
  );
};