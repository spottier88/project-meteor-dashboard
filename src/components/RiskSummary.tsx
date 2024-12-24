import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Risk {
  id: string;
  description: string;
  probability: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  mitigation_plan?: string;
}

interface RiskSummaryProps {
  projectId: string;
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

const statusColors = {
  open: "text-red-500",
  in_progress: "text-yellow-500",
  resolved: "text-green-500",
};

const statusLabels = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

export const RiskSummary = ({ projectId }: RiskSummaryProps) => {
  const { data: risks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Risk[];
    },
  });

  if (!risks?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun risque identifié pour ce projet.</p>
        </CardContent>
      </Card>
    );
  }

  const criticalRisks = risks.filter(
    (risk) => risk.probability === "high" && risk.severity === "high" && risk.status !== "resolved"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risques ({risks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalRisks.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="font-semibold text-destructive">
              {criticalRisks.length} risque{criticalRisks.length > 1 ? "s" : ""} critique{criticalRisks.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {risks.slice(0, 3).map((risk) => {
            const ProbabilityIcon = probabilityConfig[risk.probability].icon;
            const SeverityIcon = severityConfig[risk.severity].icon;
            
            return (
              <div key={risk.id} className="space-y-2">
                <p className="font-medium">{risk.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <ProbabilityIcon className={cn("h-4 w-4", probabilityConfig[risk.probability].color)} />
                    <span className="text-sm">
                      Probabilité {probabilityConfig[risk.probability].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityIcon className={cn("h-4 w-4", severityConfig[risk.severity].color)} />
                    <span className="text-sm">
                      Gravité {severityConfig[risk.severity].label}
                    </span>
                  </div>
                  <div>
                    <span className={cn("text-sm", statusColors[risk.status])}>
                      {statusLabels[risk.status]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {risks.length > 3 && (
            <p className="text-sm text-muted-foreground">
              Et {risks.length - 3} autre{risks.length - 3 > 1 ? "s" : ""} risque{risks.length - 3 > 1 ? "s" : ""}...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};