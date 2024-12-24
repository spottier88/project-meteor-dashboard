import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RiskProbability = "low" | "medium" | "high";
type RiskSeverity = "low" | "medium" | "high";
type RiskStatus = "open" | "in_progress" | "resolved";

interface RiskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  projectId: string;
  risk?: {
    id: string;
    description: string;
    probability: RiskProbability;
    severity: RiskSeverity;
    status: RiskStatus;
    mitigation_plan?: string;
  };
}

export const RiskForm = ({ isOpen, onClose, onSubmit, projectId, risk }: RiskFormProps) => {
  const { toast } = useToast();
  const [description, setDescription] = useState(risk?.description || "");
  const [probability, setProbability] = useState<RiskProbability>(risk?.probability || "medium");
  const [severity, setSeverity] = useState<RiskSeverity>(risk?.severity || "medium");
  const [status, setStatus] = useState<RiskStatus>(risk?.status || "open");
  const [mitigationPlan, setMitigationPlan] = useState(risk?.mitigation_plan || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Erreur",
        description: "La description du risque est requise",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const riskData = {
        project_id: projectId,
        description,
        probability,
        severity,
        status,
        mitigation_plan: mitigationPlan,
      };

      if (risk?.id) {
        const { error } = await supabase
          .from("risks")
          .update(riskData)
          .eq("id", risk.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le risque a été mis à jour",
        });
      } else {
        const { error } = await supabase.from("risks").insert(riskData);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le risque a été créé",
        });
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {risk ? "Modifier le risque" : "Nouveau risque"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du risque"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="probability" className="text-sm font-medium">
                Probabilité
              </label>
              <Select value={probability} onValueChange={setProbability}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une probabilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="severity" className="text-sm font-medium">
                Gravité
              </label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une gravité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Statut
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="mitigation_plan" className="text-sm font-medium">
              Plan de mitigation
            </label>
            <Textarea
              id="mitigation_plan"
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder="Actions prévues pour réduire le risque"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Enregistrement..."
            ) : risk ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};