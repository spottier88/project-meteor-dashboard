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
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface PoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  pole?: { id: string; name: string };
}

export const PoleForm = ({ isOpen, onClose, pole }: PoleFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(pole?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du pôle est requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (pole) {
        const { error } = await supabase
          .from("poles")
          .update({ name })
          .eq("id", pole.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("poles").insert({ name });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["poles"] });
      toast({
        title: "Succès",
        description: pole
          ? "Le pôle a été mis à jour"
          : "Le pôle a été créé",
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
          <DialogTitle>{pole ? "Modifier le pôle" : "Nouveau pôle"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du pôle"
            />
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