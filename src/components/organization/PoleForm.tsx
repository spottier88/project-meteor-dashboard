import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  pole?: {
    id: string;
    name: string;
  };
}

export const PoleForm = ({ isOpen, onClose, onSubmit, pole }: PoleFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opening/closing or when pole changes
  useEffect(() => {
    if (isOpen) {
      setName(pole?.name || "");
    }
  }, [isOpen, pole]);

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
      if (pole?.id) {
        const { error } = await supabase
          .from("poles")
          .update({ name })
          .eq("id", pole.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le pôle a été mis à jour",
        });
      } else {
        const { error } = await supabase.from("poles").insert({ name });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le pôle a été créé",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{pole ? "Modifier le pôle" : "Nouveau pôle"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
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
            {isSubmitting ? "Enregistrement..." : pole ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};