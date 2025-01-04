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
  project?: {
    id: string;
    title: string;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
  };
}

export const OrganizationFields = ({
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
  project,
}: OrganizationFieldsProps) => {
  console.log("OrganizationFields - Component mounted with props:", {
    poleId,
    directionId,
    serviceId,
    project: project ? {
      id: project.id,
      title: project.title,
      pole_id: project.pole_id,
      direction_id: project.direction_id,
      service_id: project.service_id
    } : 'No project data'
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch poles data
  const { data: poles, isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      console.log("Poles data received:", data);
      return data;
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
      console.log("Directions data received:", data);
      return data;
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
      console.log("Services data received:", data);
      return data;
    },
  });

  // Effet pour l'initialisation
  useEffect(() => {
    if (!isInitialized && !isLoadingPoles && !isLoadingDirections && !isLoadingServices && project) {
      console.log("Starting initialization with project data:", project);
      
      if (project.pole_id) {
        console.log("Setting pole_id from project:", project.pole_id);
        setPoleId(project.pole_id);
      }
      
      if (project.direction_id) {
        console.log("Setting direction_id from project:", project.direction_id);
        setDirectionId(project.direction_id);
      }
      
      if (project.service_id) {
        console.log("Setting service_id from project:", project.service_id);
        setServiceId(project.service_id);
      }
      
      setIsInitialized(true);
    }
  }, [
    isInitialized,
    isLoadingPoles,
    isLoadingDirections,
    isLoadingServices,
    project,
    setPoleId,
    setDirectionId,
    setServiceId,
  ]);

  // Filtrer les directions et services
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