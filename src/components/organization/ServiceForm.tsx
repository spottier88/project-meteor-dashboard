import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  service?: {
    id: string;
    name: string;
    direction_id: string;
  };
}

export const ServiceForm = ({ isOpen, onClose, onSubmit, service }: ServiceFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(service?.name || "");
  const [directionId, setDirectionId] = useState(service?.direction_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*, poles(name)");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!name.trim() || !directionId) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (service?.id) {
        const { error } = await supabase
          .from("services")
          .update({ name, direction_id: directionId })
          .eq("id", service.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le service a été mis à jour",
        });
      } else {
        const { error } = await supabase
          .from("services")
          .insert({ name, direction_id: directionId });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le service a été créé",
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
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du service"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="direction">Direction</Label>
            <Select value={directionId} onValueChange={setDirectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une direction" />
              </SelectTrigger>
              <SelectContent>
                {directions?.map((direction) => (
                  <SelectItem key={direction.id} value={direction.id}>
                    {direction.name} ({direction.poles?.name})
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
            {isSubmitting ? "Enregistrement..." : service ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};