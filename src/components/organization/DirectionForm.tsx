import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface DirectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  poles: Array<{ id: string; name: string }>;
  direction?: { id: string; name: string; pole_id: string };
}

export const DirectionForm = ({
  isOpen,
  onClose,
  poles,
  direction,
}: DirectionFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(direction?.name || "");
  const [poleId, setPoleId] = useState(direction?.pole_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !poleId) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (direction) {
        const { error } = await supabase
          .from("directions")
          .update({ name, pole_id: poleId })
          .eq("id", direction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("directions")
          .insert({ name, pole_id: poleId });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["poles"] });
      toast({
        title: "Succès",
        description: direction
          ? "La direction a été mise à jour"
          : "La direction a été créée",
      });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {direction ? "Modifier la direction" : "Nouvelle direction"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la direction"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pole">Pôle</Label>
            <Select value={poleId} onValueChange={setPoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pôle" />
              </SelectTrigger>
              <SelectContent>
                {poles.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};