
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { RiskSelectors, RiskProbability, RiskSeverity, RiskStatus } from "./risk/RiskSelectors";

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
  const { user } = useAuthContext();
  const [description, setDescription] = useState("");
  const [probability, setProbability] = useState<RiskProbability>("medium");
  const [severity, setSeverity] = useState<RiskSeverity>("medium");
  const [status, setStatus] = useState<RiskStatus>("open");
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (risk) {
      setDescription(risk.description);
      setProbability(risk.probability);
      setSeverity(risk.severity);
      setStatus(risk.status);
      setMitigationPlan(risk.mitigation_plan || "");
    }
  }, [risk]);

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setProbability("medium");
      setSeverity("medium");
      setStatus("open");
      setMitigationPlan("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

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
          
          <RiskSelectors
            probability={probability}
            setProbability={setProbability}
            severity={severity}
            setSeverity={setSeverity}
            status={status}
            setStatus={setStatus}
          />

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
