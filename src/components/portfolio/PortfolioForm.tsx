
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortfolioWithStats, PortfolioFormData } from "@/types/portfolio";
import { useCreatePortfolio, useUpdatePortfolio } from "@/hooks/usePortfolios";

interface PortfolioFormProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio?: PortfolioWithStats | null;
}

export const PortfolioForm = ({ isOpen, onClose, portfolio }: PortfolioFormProps) => {
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: "",
    description: "",
    strategic_objectives: "",
    budget_total: undefined,
    start_date: "",
    end_date: "",
    status: "actif",
  });

  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();

  const isEditing = Boolean(portfolio);
  const isSubmitting = createPortfolio.isPending || updatePortfolio.isPending;

  useEffect(() => {
    if (portfolio) {
      setFormData({
        name: portfolio.name,
        description: portfolio.description || "",
        strategic_objectives: portfolio.strategic_objectives || "",
        budget_total: portfolio.budget_total || undefined,
        start_date: portfolio.start_date || "",
        end_date: portfolio.end_date || "",
        status: portfolio.status || "actif",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        strategic_objectives: "",
        budget_total: undefined,
        start_date: "",
        end_date: "",
        status: "actif",
      });
    }
  }, [portfolio, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (isEditing && portfolio) {
        await updatePortfolio.mutateAsync({ id: portfolio.id, data: formData });
      } else {
        await createPortfolio.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le portefeuille" : "Créer un nouveau portefeuille"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du portefeuille *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du portefeuille"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du portefeuille"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="strategic_objectives">Objectifs stratégiques</Label>
            <Textarea
              id="strategic_objectives"
              value={formData.strategic_objectives}
              onChange={(e) => setFormData({ ...formData, strategic_objectives: e.target.value })}
              placeholder="Objectifs stratégiques du portefeuille"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget_total">Budget total (€)</Label>
              <Input
                id="budget_total"
                type="number"
                value={formData.budget_total || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  budget_total: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="Budget total"
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "En cours..." : isEditing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
