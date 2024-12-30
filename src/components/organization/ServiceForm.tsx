import { useState, useMemo } from "react";
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

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  poles: Array<{
    id: string;
    name: string;
    directions: Array<{ id: string; name: string }>;
  }>;
  service?: { id: string; name: string; direction_id: string };
}

export const ServiceForm = ({
  isOpen,
  onClose,
  poles,
  service,
}: ServiceFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(service?.name || "");
  const [poleId, setPoleId] = useState("");
  const [directionId, setDirectionId] = useState(service?.direction_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const directions = useMemo(() => {
    const selectedPole = poles.find((p) => p.id === poleId);
    return selectedPole?.directions || [];
  }, [poles, poleId]);

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
      if (service) {
        const { error } = await supabase
          .from("services")
          .update({ name, direction_id: directionId })
          .eq("id", service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert({ name, direction_id: directionId });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["poles"] });
      toast({
        title: "Succès",
        description: service
          ? "Le service a été mis à jour"
          : "Le service a été créé",
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
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du service"
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
          <div className="space-y-2">
            <Label htmlFor="direction">Direction</Label>
            <Select value={directionId} onValueChange={setDirectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une direction" />
              </SelectTrigger>
              <SelectContent>
                {directions.map((direction) => (
                  <SelectItem key={direction.id} value={direction.id}>
                    {direction.name}
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