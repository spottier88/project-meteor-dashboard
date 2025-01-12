import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Risk } from "@/types/risk";
import { Plus } from "lucide-react";
import { RiskForm } from "./RiskForm";
import { RiskCard } from "./risk/RiskCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface RiskListProps {
  projectId: string;
  projectTitle: string;
  readOnly?: boolean;
  onRiskSubmit?: () => void;
}

export const RiskList = ({ projectId, projectTitle, readOnly = false, onRiskSubmit }: RiskListProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isRiskFormOpen, setIsRiskFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | undefined>(undefined);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

      toast({
        title: "Succès",
        description: "Le risque a été supprimé",
      });
      
      queryClient.invalidateQueries({ queryKey: ["risks", projectId] });
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setRiskToDelete(null);
    }
  };

  const handleRiskFormSubmit = async () => {
    await queryClient.invalidateQueries({ queryKey: ["risks", projectId] });
    setIsRiskFormOpen(false);
    setSelectedRisk(undefined);
    onRiskSubmit?.();
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
            onDelete={() => setRiskToDelete(risk)}
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
        onSubmit={handleRiskFormSubmit}
        projectId={projectId}
        risk={selectedRisk}
      />

      <AlertDialog open={!!riskToDelete} onOpenChange={() => setRiskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer définitivement le risque.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => riskToDelete && handleDeleteRisk(riskToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};