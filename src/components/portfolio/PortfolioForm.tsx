
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Portfolio, CreatePortfolioData } from "@/types/portfolio";

interface PortfolioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePortfolioData) => void;
  portfolio?: Portfolio | null;
  isLoading?: boolean;
}

export const PortfolioForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  portfolio, 
  isLoading = false 
}: PortfolioFormProps) => {
  const [formData, setFormData] = useState<CreatePortfolioData>({
    name: "",
    description: "",
    strategic_objectives: "",
    budget_total: undefined,
    start_date: "",
    end_date: "",
    status: "actif",
  });

  useEffect(() => {
    if (portfolio) {
      setFormData({
        name: portfolio.name,
        description: portfolio.description || "",
        strategic_objectives: portfolio.strategic_objectives || "",
        budget_total: portfolio.budget_total || undefined,
        start_date: portfolio.start_date || "",
        end_date: portfolio.end_date || "",
        status: portfolio.status,
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
  }, [portfolio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreatePortfolioData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {portfolio ? "Modifier le portefeuille" : "Créer un nouveau portefeuille"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du portefeuille *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategic_objectives">Objectifs stratégiques</Label>
            <Textarea
              id="strategic_objectives"
              value={formData.strategic_objectives}
              onChange={(e) => handleChange("strategic_objectives", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_total">Budget total (€)</Label>
              <Input
                id="budget_total"
                type="number"
                value={formData.budget_total || ""}
                onChange={(e) => handleChange("budget_total", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "En cours..." : (portfolio ? "Modifier" : "Créer")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
