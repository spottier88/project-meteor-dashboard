import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskForm } from "./RiskForm";
import { ShieldAlert, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

type RiskProbability = "low" | "medium" | "high";
type RiskSeverity = "low" | "medium" | "high";
type RiskStatus = "open" | "in_progress" | "resolved";

interface Risk {
  id: string;
  description: string;
  probability: RiskProbability;
  severity: RiskSeverity;
  status: RiskStatus;
  mitigation_plan?: string;
  created_at: string;
  updated_at: string;
}

interface RiskListProps {
  projectId: string;
  projectTitle: string;
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

export const RiskList = ({ projectId, projectTitle }: RiskListProps) => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);

  const { data: risks, refetch } = useQuery({
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

  const handleEdit = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!riskToDelete) return;

    try {
      const { error } = await supabase
        .from("risks")
        .delete()
        .eq("id", riskToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le risque a été supprimé",
      });

      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setRiskToDelete(null);
    }
  };

  const getImpactLevel = (probability: RiskProbability, severity: RiskSeverity) => {
    const levels = { low: 1, medium: 2, high: 3 };
    const impact = levels[probability] * levels[severity];
    if (impact >= 6) return "Critique";
    if (impact >= 3) return "Important";
    return "Modéré";
  };

  const getImpactColor = (probability: RiskProbability, severity: RiskSeverity) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Risques du projet</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un risque
        </Button>
      </div>

      <div className="grid gap-4">
        {risks?.map((risk) => (
          <Card key={risk.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{risk.description}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(risk)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRiskToDelete(risk)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Probabilité</p>
                  <p className="font-medium">
                    {probabilityLabels[risk.probability as keyof typeof probabilityLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gravité</p>
                  <p className="font-medium">
                    {severityLabels[risk.severity as keyof typeof severityLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impact global</p>
                  <p className={`font-medium ${getImpactColor(risk.probability, risk.severity)}`}>
                    {getImpactLevel(risk.probability, risk.severity)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className={`font-medium ${statusColors[risk.status as keyof typeof statusColors]}`}>
                    {statusLabels[risk.status as keyof typeof statusLabels]}
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
        ))}

        {risks?.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Aucun risque n'a été ajouté à ce projet
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <RiskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRisk(null);
        }}
        onSubmit={refetch}
        projectId={projectId}
        risk={selectedRisk || undefined}
      />

      <AlertDialog open={!!riskToDelete} onOpenChange={() => setRiskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le risque sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
