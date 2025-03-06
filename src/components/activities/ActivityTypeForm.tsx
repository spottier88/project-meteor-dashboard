
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";
import { Switch } from "@/components/ui/switch";

interface ActivityTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  activityType?: ActivityType;
}

export const ActivityTypeForm = ({ isOpen, onClose, onSubmit, activityType }: ActivityTypeFormProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#808080");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Réinitialiser le formulaire quand il s'ouvre/se ferme ou lorsque activityType change
  useEffect(() => {
    if (isOpen) {
      setCode(activityType?.code || "");
      setLabel(activityType?.label || "");
      setColor(activityType?.color || "#808080");
      setDisplayOrder(activityType?.display_order || 0);
      setIsActive(activityType?.is_active ?? true);
      setCodeError("");
    }
  }, [isOpen, activityType]);

  const validateForm = () => {
    // Réinitialiser les erreurs
    setCodeError("");
    
    // Validation du code (ne doit contenir que des lettres minuscules, chiffres et underscores)
    if (!code.trim()) {
      setCodeError("Le code est requis");
      return false;
    }
    
    if (!/^[a-z0-9_]+$/.test(code)) {
      setCodeError("Le code ne peut contenir que des lettres minuscules, des chiffres et des underscores");
      return false;
    }
    
    // Validation du label
    if (!label.trim()) {
      toast({
        title: "Erreur",
        description: "Le libellé est requis",
        variant: "destructive",
      });
      return false;
    }
    
    // Validation de la couleur (format hexadécimal)
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      toast({
        title: "Erreur",
        description: "La couleur doit être au format hexadécimal (#RRGGBB)",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (activityType?.id) {
        // Mise à jour d'un type existant
        const { error } = await supabase
          .from("activity_types")
          .update({ 
            label,
            color,
            display_order: displayOrder,
            is_active: isActive
          })
          .eq("id", activityType.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le type d'activité a été mis à jour",
        });
      } else {
        // Création d'un nouveau type
        // Vérifier si le code existe déjà
        const { data: existingCodes, error: checkError } = await supabase
          .from("activity_types")
          .select("code")
          .eq("code", code)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingCodes) {
          setCodeError("Ce code existe déjà");
          setIsSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from("activity_types")
          .insert({
            code,
            label,
            color,
            display_order: displayOrder,
            is_active: isActive
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le type d'activité a été créé",
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
          <DialogTitle>{activityType ? "Modifier le type d'activité" : "Nouveau type d'activité"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code unique (ex: meeting)"
              disabled={!!activityType} // Désactiver si modification
              className={codeError ? "border-red-500" : ""}
            />
            {codeError && <p className="text-sm text-red-500">{codeError}</p>}
            {!!activityType && <p className="text-xs text-muted-foreground">Le code ne peut pas être modifié après création</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé affiché (ex: Réunion)"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#RRGGBB"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="order">Ordre d'affichage</Label>
            <Input
              id="order"
              type="number"
              min="0"
              step="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch 
              id="is-active" 
              checked={isActive} 
              onCheckedChange={setIsActive} 
            />
            <Label htmlFor="is-active" className="cursor-pointer">Actif</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : activityType ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
