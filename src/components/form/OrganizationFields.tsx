import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
  // Fetch poles data
  const { data: poles, isLoading: isLoadingPoles } = useQuery({
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

  // Fetch directions data
  const { data: allDirections, isLoading: isLoadingDirections } = useQuery({
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

  // Fetch services data
  const { data: allServices, isLoading: isLoadingServices } = useQuery({
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

  // Filter directions based on selected pole
  const directions = allDirections?.filter(
    d => poleId !== "none" && d.pole_id === poleId
  ) || [];

  // Filter services based on selected direction
  const services = allServices?.filter(
    s => directionId !== "none" && s.direction_id === directionId
  ) || [];

  // Validate selections when data is loaded
  useEffect(() => {
    if (!isLoadingPoles && !isLoadingDirections && !isLoadingServices) {
      // Si un pôle est sélectionné mais n'existe pas dans la liste
      if (poleId !== "none" && !poles?.some(p => p.id === poleId)) {
        console.log("Resetting pole because it doesn't exist:", poleId);
        setPoleId("none");
        setDirectionId("none");
        setServiceId("none");
        return;
      }

      // Si une direction est sélectionnée mais n'appartient pas au pôle sélectionné
      if (directionId !== "none") {
        const direction = allDirections?.find(d => d.id === directionId);
        if (!direction || direction.pole_id !== poleId) {
          console.log("Resetting direction because it doesn't match pole:", directionId, poleId);
          setDirectionId("none");
          setServiceId("none");
          return;
        }
      }

      // Si un service est sélectionné mais n'appartient pas à la direction sélectionnée
      if (serviceId !== "none") {
        const service = allServices?.find(s => s.id === serviceId);
        if (!service || service.direction_id !== directionId) {
          console.log("Resetting service because it doesn't match direction:", serviceId, directionId);
          setServiceId("none");
        }
      }
    }
  }, [
    isLoadingPoles,
    isLoadingDirections,
    isLoadingServices,
    poles,
    allDirections,
    allServices,
    poleId,
    directionId,
    serviceId,
  ]);

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