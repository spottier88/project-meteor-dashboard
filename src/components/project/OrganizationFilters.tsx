
/**
 * @component OrganizationFilters
 * @description Ensemble de filtres pour les entités organisationnelles.
 * Permet de filtrer les projets par pôle, direction et service.
 * Gère les dépendances entre les filtres (réinitialisation des valeurs
 * enfants quand un parent change).
 */

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface OrganizationFiltersProps {
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
}

export const OrganizationFilters = ({
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
}: OrganizationFiltersProps) => {
  // Récupérer tous les pôles
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

  // Récupérer les directions du pôle sélectionné
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["directions", poleId],
    queryFn: async () => {
      if (poleId === "all" || poleId === "none") {
        return [];
      }
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", poleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: poleId !== "all" && poleId !== "none",
  });

  // Récupérer les services de la direction sélectionnée
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", directionId],
    queryFn: async () => {
      if (directionId === "all" || directionId === "none") {
        return [];
      }
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", directionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: directionId !== "all" && directionId !== "none",
  });

  // Réinitialiser la direction si le pôle change
  useEffect(() => {
    setDirectionId("all");
  }, [poleId, setDirectionId]);

  // Réinitialiser le service si la direction change
  useEffect(() => {
    setServiceId("all");
  }, [directionId, setServiceId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sélecteur de pôle */}
      <div className="space-y-2">
        <Label htmlFor="pole-filter" className="text-sm font-medium">
          Pôle
        </Label>
        <Select value={poleId} onValueChange={setPoleId}>
          <SelectTrigger id="pole-filter">
            <SelectValue placeholder="Tous les pôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pôles</SelectItem>
            <SelectItem value="none">Aucun pôle</SelectItem>
            {poles?.map((pole) => (
              <SelectItem key={pole.id} value={pole.id}>{pole.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur de direction */}
      <div className="space-y-2">
        <Label htmlFor="direction-filter" className="text-sm font-medium">
          Direction
        </Label>
        <Select 
          value={directionId} 
          onValueChange={setDirectionId}
          disabled={poleId === "all" || poleId === "none" || isLoadingDirections}
        >
          <SelectTrigger id="direction-filter">
            <SelectValue placeholder="Toutes les directions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les directions</SelectItem>
            <SelectItem value="none">Aucune direction</SelectItem>
            {directions?.map((direction) => (
              <SelectItem key={direction.id} value={direction.id}>{direction.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur de service */}
      <div className="space-y-2">
        <Label htmlFor="service-filter" className="text-sm font-medium">
          Service
        </Label>
        <Select 
          value={serviceId} 
          onValueChange={setServiceId}
          disabled={directionId === "all" || directionId === "none" || isLoadingServices}
        >
          <SelectTrigger id="service-filter">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            <SelectItem value="none">Aucun service</SelectItem>
            {services?.map((service) => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
