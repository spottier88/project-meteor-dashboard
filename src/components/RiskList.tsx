import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Risk } from "@/types/risk";

interface RiskListProps {
  projectId: string;
  projectTitle: string;
  readOnly?: boolean;
}

export const RiskList = ({ projectId, projectTitle, readOnly = false }: RiskListProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isRiskFormOpen, setIsRiskFormOpen] = useState(false);

  const { data: riskData } = useQuery({
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

  useEffect(() => {
    if (riskData) {
      setRisks(riskData);
    }
  }, [riskData]);

  return (
    <div>
      {!readOnly && (
        <Button onClick={() => setIsRiskFormOpen(true)} className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau risque
        </Button>
      )}
      <ul>
        {risks.map((risk) => (
          <li key={risk.id}>
            <h3>{risk.title}</h3>
            <p>{risk.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
