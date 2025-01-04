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
  initialPoleId?: string | null;
  initialDirectionId?: string | null;
  initialServiceId?: string | null;
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
  initialPoleId,
  initialDirectionId,
  initialServiceId,
}: OrganizationFieldsProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch all data at once
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as OrganizationData[];
    },
  });

  const { data: allDirections } = useQuery({
    queryKey: ["all_directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as OrganizationData[];
    },
  });

  const { data: allServices } = useQuery({
    queryKey: ["all_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as OrganizationData[];
    },
  });

  // Initialize fields once all data is loaded
  useEffect(() => {
    if (!isInitialized && poles && allDirections && allServices) {
      // Initialize pole if valid
      if (initialPoleId && poles.some(p => p.id === initialPoleId)) {
        setPoleId(initialPoleId);
        
        // Initialize direction if valid for selected pole
        if (initialDirectionId) {
          const validDirection = allDirections.find(
            d => d.id === initialDirectionId && d.pole_id === initialPoleId
          );
          if (validDirection) {
            setDirectionId(initialDirectionId);

            // Initialize service if valid for selected direction
            if (initialServiceId) {
              const validService = allServices.find(
                s => s.id === initialServiceId && s.direction_id === initialDirectionId
              );
              if (validService) {
                setServiceId(initialServiceId);
              }
            }
          }
        }
      }
      setIsInitialized(true);
    }
  }, [
    poles,
    allDirections,
    allServices,
    initialPoleId,
    initialDirectionId,
    initialServiceId,
    setPoleId,
    setDirectionId,
    setServiceId,
    isInitialized,
  ]);

  // Filter directions based on selected pole
  const directions = allDirections?.filter(
    d => d.pole_id === poleId
  ) || [];

  // Filter services based on selected direction
  const services = allServices?.filter(
    s => s.direction_id === directionId
  ) || [];

  const handlePoleChange = (value: string) => {
    setPoleId(value);
    setDirectionId("none");
    setServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    setDirectionId(value);
    setServiceId("none");
  };

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