
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { OrganizationFieldsSelects } from "../organization/OrganizationFieldsSelects";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { AccessibleOrganization } from "@/types/user";

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
  const { canAccessAllOrganizations, accessibleOrganizations, isLoadingOrganizations } = usePermissionsContext();

  // Récupérer les données des pôles - pour les admins ou si on a besoin de tous les pôles
  const { data: allPoles, isLoading: isLoadingAllPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: canAccessAllOrganizations,
  });

  // Récupérer les données des directions - pour les admins ou si on a besoin de toutes les directions
  const { data: allDirections, isLoading: isLoadingAllDirections } = useQuery({
    queryKey: ["all_directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: canAccessAllOrganizations,
  });

  // Récupérer les données des services - pour les admins ou si on a besoin de tous les services
  const { data: allServices, isLoading: isLoadingAllServices } = useQuery({
    queryKey: ["all_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: canAccessAllOrganizations,
  });

  // Effet pour l'initialisation
  useEffect(() => {
    if (!isInitialized && 
        ((canAccessAllOrganizations && !isLoadingAllPoles && !isLoadingAllDirections && !isLoadingAllServices) || 
         (!canAccessAllOrganizations && !isLoadingOrganizations && accessibleOrganizations)) && 
        project) {
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
    isLoadingAllPoles,
    isLoadingAllDirections,
    isLoadingAllServices,
    isLoadingOrganizations,
    canAccessAllOrganizations,
    accessibleOrganizations,
    project,
    setPoleId,
    setDirectionId,
    setServiceId,
  ]);

  // Définir les sources de données en fonction des permissions
  const poles = canAccessAllOrganizations ? allPoles : accessibleOrganizations?.poles;
  const isLoadingPoles = canAccessAllOrganizations ? isLoadingAllPoles : isLoadingOrganizations;

  // Filtrer les directions accessibles en fonction du pôle sélectionné
  let directions: any[] = [];
  const isLoadingDirections = canAccessAllOrganizations ? isLoadingAllDirections : isLoadingOrganizations;
  
  if (canAccessAllOrganizations) {
    directions = (allDirections || []).filter(d => poleId !== "none" && d.pole_id === poleId);
  } else if (accessibleOrganizations) {
    if (poleId !== "none") {
      // Si un pôle est sélectionné, récupérer les directions spécifiques à ce pôle
      const { data: poleDirections } = await supabase
        .from("directions")
        .select("id, name, pole_id")
        .eq("pole_id", poleId)
        .order("name");
        
      // Filtrer pour ne garder que les directions accessibles
      const accessibleDirectionIds = new Set(accessibleOrganizations.directions.map(d => d.id));
      directions = (poleDirections || []).filter(d => accessibleDirectionIds.has(d.id));
    } else {
      directions = [];
    }
  }

  // Filtrer les services accessibles en fonction de la direction sélectionnée
  let services: any[] = [];
  const isLoadingServices = canAccessAllOrganizations ? isLoadingAllServices : isLoadingOrganizations;
  
  if (canAccessAllOrganizations) {
    services = (allServices || []).filter(s => directionId !== "none" && s.direction_id === directionId);
  } else if (accessibleOrganizations) {
    if (directionId !== "none") {
      // Si une direction est sélectionnée, récupérer les services spécifiques à cette direction
      const { data: directionServices } = await supabase
        .from("services")
        .select("id, name, direction_id")
        .eq("direction_id", directionId)
        .order("name");
        
      // Filtrer pour ne garder que les services accessibles
      const accessibleServiceIds = new Set(accessibleOrganizations.services.map(s => s.id));
      services = (directionServices || []).filter(s => accessibleServiceIds.has(s.id));
    } else {
      services = [];
    }
  }

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
