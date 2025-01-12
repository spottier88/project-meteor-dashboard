import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Risk } from "@/types/risk";
import { Plus } from "lucide-react";
import { RiskForm } from "./RiskForm";
import { RiskCard } from "./risk/RiskCard";

interface RiskListProps {
  projectId: string;
  projectTitle: string;
  readOnly?: boolean;
}

export const RiskList = ({ projectId, projectTitle, readOnly = false }: RiskListProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isRiskFormOpen, setIsRiskFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | undefined>(undefined);

  const { data: riskData } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as Risk[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (riskData) {
      setRisks(riskData);
    }
  }, [riskData]);

  const handleEditRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsRiskFormOpen(true);
  };

  const handleDeleteRisk = async (risk: Risk) => {
    try {
      const { error } = await supabase
        .from("risks")
        .delete()
        .eq("id", risk.id);

      if (error) throw error;

      setRisks(risks.filter((r) => r.id !== risk.id));
    } catch (error) {
      console.error("Error deleting risk:", error);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Button onClick={() => setIsRiskFormOpen(true)} className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau risque
        </Button>
      )}

      <div className="grid gap-4">
        {risks.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onEdit={handleEditRisk}
            onDelete={handleDeleteRisk}
            showActions={!readOnly}
          />
        ))}
      </div>

      <RiskForm
        isOpen={isRiskFormOpen}
        onClose={() => {
          setIsRiskFormOpen(false);
          setSelectedRisk(undefined);
        }}
        onSubmit={() => {
          setIsRiskFormOpen(false);
          setSelectedRisk(undefined);
        }}
        projectId={projectId}
        risk={selectedRisk}
      />
    </div>
  );
};