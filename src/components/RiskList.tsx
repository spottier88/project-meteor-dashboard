
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { RiskForm } from "./RiskForm";
import { RiskCard } from "./risk/RiskCard";
import { useRiskAccess } from "@/hooks/use-risk-access";

export interface RiskListProps {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
  onUpdate?: () => void; // Ajout de la propriété onUpdate en option
  preloadedRisks?: any[]; // Données pré-chargées optionnelles
}

export const RiskList = ({
  projectId,
  projectTitle,
  canEdit,
  isProjectManager,
  isAdmin,
  onUpdate, // Ajout du paramètre onUpdate
  preloadedRisks,
}: RiskListProps) => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const { canCreateRisk, canEditRisk, canDeleteRisk } = useRiskAccess(projectId);

  // Utiliser les données pré-chargées si disponibles, sinon faire la requête
  const { data: queriedRisks, isLoading, isError, refetch } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !preloadedRisks, // Ne charger que si pas de données pré-chargées
  });

  const risks = preloadedRisks || queriedRisks;

  const handleEdit = (risk: any) => {
    if (canEditRisk) {
      setSelectedRisk(risk);
      setIsFormOpen(true);
    }
  };

  const handleDelete = async (risk: any) => {
    if (!canDeleteRisk) return;
    
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

      refetch();
      
      // Appel de la fonction onUpdate après la suppression
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRisk(null);
  };

  const handleFormSubmit = () => {
    refetch();
    // Appel de la fonction onUpdate après la soumission du formulaire
    if (onUpdate) {
      onUpdate();
    }
    handleFormClose();
  };

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Erreur lors du chargement des risques.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Risques du projet</h2>
        {canCreateRisk && (
          <Button onClick={() => setIsFormOpen(true)}>
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.map((risk) => (
              <RiskCard
                key={risk.id}
                risk={risk}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Aucun risque trouvé pour ce projet.</p>
      )}

      <RiskForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        projectId={projectId}
        risk={selectedRisk}
      />
    </div>
  );
};
