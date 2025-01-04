import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface DirectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  direction?: {
    id: string;
    name: string;
    pole_id: string;
  };
}

export const DirectionForm = ({ isOpen, onClose, onSubmit, direction }: DirectionFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [poleId, setPoleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Reset form when opening/closing or when direction changes
  useEffect(() => {
    if (isOpen) {
      setName(direction?.name || "");
      setPoleId(direction?.pole_id || "");
    }
  }, [isOpen, direction]);

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
      if (direction?.id) {
        const { error } = await supabase
          .from("directions")
          .update({ name, pole_id: poleId })
          .eq("id", direction.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La direction a été mise à jour",
        });
      } else {
        const { error } = await supabase
          .from("directions")
          .insert({ name, pole_id: poleId });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La direction a été créée",
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
          <DialogTitle>
            {direction ? "Modifier la direction" : "Nouvelle direction"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la direction"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pole">Pôle</Label>
            <Select value={poleId} onValueChange={setPoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pôle" />
              </SelectTrigger>
              <SelectContent>
                {poles?.map((pole) => (
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
            {isSubmitting ? "Enregistrement..." : direction ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};