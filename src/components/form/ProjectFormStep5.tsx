
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { ForEntityType } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface ProjectFormStep5Props {
  forEntityType: ForEntityType;
  setForEntityType: (value: ForEntityType) => void;
  forEntityId: string | undefined;
  setForEntityId: (value: string | undefined) => void;
}

export const ProjectFormStep5 = ({
  forEntityType,
  setForEntityType,
  forEntityId,
  setForEntityId,
}: ProjectFormStep5Props) => {
  // Réinitialiser l'ID quand le type change
  useEffect(() => {
    if (forEntityId) {
      setForEntityId(undefined);
    }
  }, [forEntityType]);

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
    enabled: forEntityType === "pole",
  });

  // Charger les directions
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["all_directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: forEntityType === "direction",
  });

  // Charger les services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["all_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: forEntityType === "service",
  });

  const isLoading = isLoadingPoles || isLoadingDirections || isLoadingServices;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Informations complémentaires</h2>
      
      <div className="grid gap-2">
        <Label htmlFor="for-entity-type">Projet réalisé pour</Label>
        <Select
          value={forEntityType || "null"}
          onValueChange={(value) => {
            setForEntityType(value === "null" ? null : value as ForEntityType);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type d'entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Aucune entité spécifique</SelectItem>
            <SelectItem value="pole">Pôle</SelectItem>
            <SelectItem value="direction">Direction</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {forEntityType && (
        <div className="grid gap-2">
          <Label htmlFor="for-entity-id">Entité spécifique</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={forEntityId}
              onValueChange={setForEntityId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entité" />
              </SelectTrigger>
              <SelectContent>
                {forEntityType === "pole" &&
                  poles?.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.name}
                    </SelectItem>
                  ))}
                {forEntityType === "direction" &&
                  directions?.map((direction) => (
                    <SelectItem key={direction.id} value={direction.id}>
                      {direction.name}
                    </SelectItem>
                  ))}
                {forEntityType === "service" &&
                  services?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
};
