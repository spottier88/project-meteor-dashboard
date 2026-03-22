
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TemplateVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateTitle: string;
}

// Représente une affectation de visibilité
interface VisibilityAssignment {
  entity_type: "pole" | "direction" | "service";
  entity_id: string;
}

/**
 * Dialog permettant de gérer les affectations organisationnelles d'un modèle de projet.
 * Permet de cocher/décocher des pôles, directions et services pour restreindre la visibilité.
 */
export const TemplateVisibilityDialog = ({
  open,
  onOpenChange,
  templateId,
  templateTitle,
}: TemplateVisibilityDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEntities, setSelectedEntities] = useState<VisibilityAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Charger la hiérarchie organisationnelle complète
  const { data: poles = [], isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: directions = [], isLoading: isLoadingDirections } = useQuery({
    queryKey: ["allDirections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("directions").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["allServices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Charger les affectations existantes du modèle
  const { data: existingAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["templateVisibility", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_template_visibility")
        .select("*")
        .eq("template_id", templateId);
      if (error) throw error;
      return data;
    },
    enabled: open && !!templateId,
  });

  // Initialiser les sélections à partir des affectations existantes
  useEffect(() => {
    if (existingAssignments.length > 0) {
      setSelectedEntities(
        existingAssignments.map((a) => ({
          entity_type: a.entity_type as "pole" | "direction" | "service",
          entity_id: a.entity_id,
        }))
      );
    } else {
      setSelectedEntities([]);
    }
  }, [existingAssignments]);

  // Vérifie si une entité est sélectionnée
  const isSelected = (entityType: string, entityId: string) =>
    selectedEntities.some((e) => e.entity_type === entityType && e.entity_id === entityId);

  // Bascule la sélection d'une entité
  const toggleEntity = (entityType: "pole" | "direction" | "service", entityId: string) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.entity_type === entityType && e.entity_id === entityId);
      if (exists) {
        return prev.filter((e) => !(e.entity_type === entityType && e.entity_id === entityId));
      }
      return [...prev, { entity_type: entityType, entity_id: entityId }];
    });
  };

  // Sauvegarde des affectations
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Supprimer toutes les affectations existantes
      await supabase
        .from("project_template_visibility")
        .delete()
        .eq("template_id", templateId);

      // Insérer les nouvelles affectations
      if (selectedEntities.length > 0) {
        const { error } = await supabase.from("project_template_visibility").insert(
          selectedEntities.map((e) => ({
            template_id: templateId,
            entity_type: e.entity_type,
            entity_id: e.entity_id,
          }))
        );
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["templateVisibility", templateId] });
      queryClient.invalidateQueries({ queryKey: ["templateVisibility"] });
      toast({
        title: "Visibilité mise à jour",
        description: "Les affectations organisationnelles ont été enregistrées.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la visibilité:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les affectations.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingPoles || isLoadingDirections || isLoadingServices || isLoadingAssignments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Visibilité — {templateTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les entités organisationnelles autorisées à utiliser ce modèle.
            Si aucune entité n'est sélectionnée, le modèle sera visible par tous.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <Accordion type="multiple" className="w-full">
              {poles.map((pole) => {
                const poleDirections = directions.filter((d) => d.pole_id === pole.id);
                return (
                  <AccordionItem key={pole.id} value={pole.id}>
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected("pole", pole.id)}
                          onCheckedChange={() => toggleEntity("pole", pole.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-medium">{pole.name}</span>
                        {isSelected("pole", pole.id) && (
                          <Badge variant="secondary" className="text-xs">Pôle</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="ml-6 space-y-2">
                        {poleDirections.map((direction) => {
                          const dirServices = services.filter(
                            (s) => s.direction_id === direction.id
                          );
                          return (
                            <div key={direction.id}>
                              <div className="flex items-center gap-2 py-1">
                                <Checkbox
                                  checked={isSelected("direction", direction.id)}
                                  onCheckedChange={() => toggleEntity("direction", direction.id)}
                                />
                                <Label className="cursor-pointer font-normal">
                                  {direction.name}
                                </Label>
                                {isSelected("direction", direction.id) && (
                                  <Badge variant="outline" className="text-xs">Direction</Badge>
                                )}
                              </div>
                              {dirServices.length > 0 && (
                                <div className="ml-6 space-y-1">
                                  {dirServices.map((service) => (
                                    <div key={service.id} className="flex items-center gap-2 py-1">
                                      <Checkbox
                                        checked={isSelected("service", service.id)}
                                        onCheckedChange={() => toggleEntity("service", service.id)}
                                      />
                                      <Label className="cursor-pointer font-normal text-sm">
                                        {service.name}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {poleDirections.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">
                            Aucune direction dans ce pôle
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {selectedEntities.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">
                  {selectedEntities.length} entité(s) sélectionnée(s)
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedEntities.map((e) => {
                    const name =
                      e.entity_type === "pole"
                        ? poles.find((p) => p.id === e.entity_id)?.name
                        : e.entity_type === "direction"
                        ? directions.find((d) => d.id === e.entity_id)?.name
                        : services.find((s) => s.id === e.entity_id)?.name;
                    return (
                      <Badge key={`${e.entity_type}-${e.entity_id}`} variant="secondary">
                        {name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedEntities.length === 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Aucune restriction — le modèle sera visible par tous les utilisateurs.
                </p>
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
