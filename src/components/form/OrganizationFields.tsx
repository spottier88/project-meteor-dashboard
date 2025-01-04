import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface OrganizationFieldsProps {
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
}

interface OrganizationData {
  id: string;
  name: string;
  pole_id?: string;
  direction_id?: string;
}

export const OrganizationFields = ({
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
}: OrganizationFieldsProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch poles data
  const { data: poles, isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      console.log("Fetching poles data...");
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching poles:", error);
        throw error;
      }
      console.log("Poles data received:", data);
      return data as OrganizationData[];
    },
  });

  // Fetch directions data
  const { data: allDirections, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["all_directions"],
    queryFn: async () => {
      console.log("Fetching directions data...");
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching directions:", error);
        throw error;
      }
      console.log("Directions data received:", data);
      return data as OrganizationData[];
    },
  });

  // Fetch services data
  const { data: allServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["all_services"],
    queryFn: async () => {
      console.log("Fetching services data...");
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching services:", error);
        throw error;
      }
      console.log("Services data received:", data);
      return data as OrganizationData[];
    },
  });

  // Effet pour l'initialisation une seule fois quand toutes les données sont chargées
  useEffect(() => {
    if (!isInitialized && !isLoadingPoles && !isLoadingDirections && !isLoadingServices) {
      console.log("Starting initialization with props:", {
        poleId,
        directionId,
        serviceId
      });

      console.log("Available data:", {
        poles: poles?.map(p => ({ id: p.id, name: p.name })),
        directions: allDirections?.map(d => ({ id: d.id, name: d.name, pole_id: d.pole_id })),
        services: allServices?.map(s => ({ id: s.id, name: s.name, direction_id: s.direction_id }))
      });
      
      // Vérifie si le pôle existe et est valide
      const poleExists = poles?.some(p => p.id === poleId);
      console.log("Pole exists check:", { poleId, exists: poleExists });
      
      if (!poleExists && poleId !== "none") {
        console.log("Resetting pole - doesn't exist:", poleId);
        setPoleId("none");
        setDirectionId("none");
        setServiceId("none");
      } else if (poleId !== "none") {
        // Vérifie si la direction appartient au pôle
        const directionValid = allDirections?.some(
          d => d.id === directionId && d.pole_id === poleId
        );
        console.log("Direction valid check:", { directionId, poleId, valid: directionValid });
        
        if (!directionValid && directionId !== "none") {
          console.log("Resetting direction - invalid for pole:", directionId);
          setDirectionId("none");
          setServiceId("none");
        } else if (directionId !== "none") {
          // Vérifie si le service appartient à la direction
          const serviceValid = allServices?.some(
            s => s.id === serviceId && s.direction_id === directionId
          );
          console.log("Service valid check:", { serviceId, directionId, valid: serviceValid });
          
          if (!serviceValid && serviceId !== "none") {
            console.log("Resetting service - invalid for direction:", serviceId);
            setServiceId("none");
          }
        }
      }
      
      setIsInitialized(true);
      console.log("Initialization complete. Final values:", { poleId, directionId, serviceId });
    }
  }, [
    isInitialized,
    isLoadingPoles,
    isLoadingDirections,
    isLoadingServices,
    poles,
    allDirections,
    allServices,
    poleId,
    directionId,
    serviceId,
    setPoleId,
    setDirectionId,
    setServiceId,
  ]);

  // Filtrer les directions et services en fonction des sélections
  const directions = allDirections?.filter(
    d => poleId !== "none" && d.pole_id === poleId
  ) || [];

  const services = allServices?.filter(
    s => directionId !== "none" && s.direction_id === directionId
  ) || [];

  const handlePoleChange = (value: string) => {
    console.log("Changing pole to:", value);
    setPoleId(value);
    setDirectionId("none");
    setServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    console.log("Changing direction to:", value);
    setDirectionId(value);
    setServiceId("none");
  };

  if (isLoadingPoles || isLoadingDirections || isLoadingServices) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <label className="text-sm font-medium">Organisation</label>
      <div className="grid gap-4">
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
            disabled={!poleId || poleId === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {directions.map((direction) => (
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
            disabled={!directionId || directionId === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};