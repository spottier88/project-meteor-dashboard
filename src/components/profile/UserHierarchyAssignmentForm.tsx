
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { HierarchyAssignment, EntityType } from "@/types/user";
import { Loader2 } from "lucide-react";

interface UserHierarchyAssignmentFormProps {
  userId: string;
  onUpdate?: () => void;
}

export function UserHierarchyAssignmentForm({ userId, onUpdate }: UserHierarchyAssignmentFormProps) {
  const { toast } = useToast();
  const [poleId, setPoleId] = useState<string>("none");
  const [directionId, setDirectionId] = useState<string>("none");
  const [serviceId, setServiceId] = useState<string>("none");
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer l'affectation hiérarchique actuelle de l'utilisateur
  const { data: currentAssignment, isLoading: isLoadingAssignment, refetch: refetchAssignment } = useQuery({
    queryKey: ["userHierarchyAssignment", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_hierarchy_assignments")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as HierarchyAssignment | null;
    },
  });

  // Charger les pôles
  const { data: poles, isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Charger les directions du pôle sélectionné
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["directions", poleId],
    queryFn: async () => {
      if (poleId === "none") return [];

      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", poleId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: poleId !== "none",
  });

  // Charger les services de la direction sélectionnée
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", directionId],
    queryFn: async () => {
      if (directionId === "none") return [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", directionId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: directionId !== "none",
  });

  // Initialiser le formulaire avec l'affectation actuelle
  useEffect(() => {
    if (currentAssignment) {
      setEntityType(currentAssignment.entity_type);
      setEntityId(currentAssignment.entity_id);

      // Charger la hiérarchie complète pour l'affectation actuelle
      const loadHierarchy = async () => {
        try {
          if (currentAssignment.entity_type === 'service') {
            const { data: serviceData } = await supabase
              .from("services")
              .select("id, name, direction_id")
              .eq("id", currentAssignment.entity_id)
              .single();

            if (serviceData) {
              setServiceId(serviceData.id);
              
              const { data: directionData } = await supabase
                .from("directions")
                .select("id, name, pole_id")
                .eq("id", serviceData.direction_id)
                .single();

              if (directionData) {
                setDirectionId(directionData.id);
                setPoleId(directionData.pole_id);
              }
            }
          } else if (currentAssignment.entity_type === 'direction') {
            const { data: directionData } = await supabase
              .from("directions")
              .select("id, name, pole_id")
              .eq("id", currentAssignment.entity_id)
              .single();

            if (directionData) {
              setDirectionId(directionData.id);
              setPoleId(directionData.pole_id);
              setServiceId("none");
            }
          } else if (currentAssignment.entity_type === 'pole') {
            setPoleId(currentAssignment.entity_id);
            setDirectionId("none");
            setServiceId("none");
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la hiérarchie:", error);
        }
      };

      loadHierarchy();
    }
  }, [currentAssignment]);

  // Réinitialiser la direction et le service lorsque le pôle change
  useEffect(() => {
    if (poleId === "none") {
      setDirectionId("none");
      setServiceId("none");
    }
  }, [poleId]);

  // Réinitialiser le service lorsque la direction change
  useEffect(() => {
    if (directionId === "none") {
      setServiceId("none");
    }
  }, [directionId]);

  const handlePoleChange = (value: string) => {
    setPoleId(value);
    setDirectionId("none");
    setServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    setDirectionId(value);
    setServiceId("none");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Déterminer l'entité et le type d'entité à sauvegarder
      let newEntityType: EntityType;
      let newEntityId: string;

      if (serviceId !== "none") {
        newEntityType = "service";
        newEntityId = serviceId;
      } else if (directionId !== "none") {
        newEntityType = "direction";
        newEntityId = directionId;
      } else if (poleId !== "none") {
        newEntityType = "pole";
        newEntityId = poleId;
      } else {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un pôle",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Supprimer l'ancienne affectation si elle existe
      if (currentAssignment) {
        await supabase
          .from("user_hierarchy_assignments")
          .delete()
          .eq("user_id", userId);
      }

      // Créer la nouvelle affectation
      const { error } = await supabase
        .from("user_hierarchy_assignments")
        .insert({
          user_id: userId,
          entity_type: newEntityType,
          entity_id: newEntityId,
        });

      if (error) throw error;

      await refetchAssignment();
      
      toast({
        title: "Succès",
        description: "Votre affectation a été mise à jour",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'affectation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'affectation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAssignment) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("user_hierarchy_assignments")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Réinitialiser les valeurs
      setPoleId("none");
      setDirectionId("none");
      setServiceId("none");
      setEntityType(null);
      setEntityId(null);

      await refetchAssignment();
      
      toast({
        title: "Succès",
        description: "Votre affectation a été supprimée",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'affectation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'affectation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAssignment || isLoadingPoles) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="pole">Pôle</Label>
        <Select value={poleId} onValueChange={handlePoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un pôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {poles?.map((pole) => (
              <SelectItem key={pole.id} value={pole.id}>
                {pole.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="direction">Direction</Label>
        <Select 
          value={directionId} 
          onValueChange={handleDirectionChange}
          disabled={poleId === "none" || isLoadingDirections}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {directions?.map((direction) => (
              <SelectItem key={direction.id} value={direction.id}>
                {direction.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="service">Service</Label>
        <Select 
          value={serviceId} 
          onValueChange={setServiceId}
          disabled={directionId === "none" || isLoadingServices}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {services?.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (poleId === "none" && !currentAssignment)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : currentAssignment ? "Mettre à jour" : "Enregistrer"}
        </Button>
        
        {currentAssignment && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : "Supprimer l'affectation"}
          </Button>
        )}
      </div>
    </div>
  );
}
