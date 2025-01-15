import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { OrganizationFieldsSelects } from "../organization/OrganizationFieldsSelects";

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
      return data;
    },
  });

  // Effet pour l'initialisation
  useEffect(() => {
    if (!isInitialized && !isLoadingPoles && !isLoadingDirections && !isLoadingServices && project) {
      if (project.pole_id) {
        setPoleId(project.pole_id);
      }
      
      if (project.direction_id) {
        setDirectionId(project.direction_id);
      }
      
      if (project.service_id) {
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

  return (
    <OrganizationFieldsSelects
      poleId={poleId}
      setPoleId={setPoleId}
      directionId={directionId}
      setDirectionId={setDirectionId}
      serviceId={serviceId}
      setServiceId={setServiceId}
      poles={poles || []}
      directions={directions}
      services={services}
      isLoadingPoles={isLoadingPoles}
      isLoadingDirections={isLoadingDirections}
      isLoadingServices={isLoadingServices}
    />
  );
};