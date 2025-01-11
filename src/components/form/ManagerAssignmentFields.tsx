import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerAssignment } from "@/types/user";

interface ManagerAssignmentFieldsProps {
  userId: string;
  onAssignmentChange: (assignment: Omit<ManagerAssignment, 'id' | 'created_at'>) => void;
}

export const ManagerAssignmentFields = ({ userId, onAssignmentChange }: ManagerAssignmentFieldsProps) => {
  const [selectedPoleId, setSelectedPoleId] = useState<string>("none");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("none");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");

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

  // Fetch directions data filtered by pole
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["directions", selectedPoleId],
    queryFn: async () => {
      if (selectedPoleId === "none") return [];
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", selectedPoleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: selectedPoleId !== "none",
  });

  // Fetch services data filtered by direction
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", selectedDirectionId],
    queryFn: async () => {
      if (selectedDirectionId === "none") return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", selectedDirectionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: selectedDirectionId !== "none",
  });

  // Effect to update assignment when selections change
  useEffect(() => {
    const assignment: Omit<ManagerAssignment, 'id' | 'created_at'> = {
      user_id: userId,
      pole_id: null,
      direction_id: null,
      service_id: null,
    };
    
    // Only set one type of ID based on the deepest selection
    if (selectedServiceId !== "none") {
      assignment.service_id = selectedServiceId;
    } else if (selectedDirectionId !== "none") {
      assignment.direction_id = selectedDirectionId;
    } else if (selectedPoleId !== "none") {
      assignment.pole_id = selectedPoleId;
    }

    onAssignmentChange(assignment);
  }, [selectedPoleId, selectedDirectionId, selectedServiceId, userId, onAssignmentChange]);

  const handlePoleChange = (value: string) => {
    setSelectedPoleId(value);
    setSelectedDirectionId("none");
    setSelectedServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    setSelectedDirectionId(value);
    setSelectedServiceId("none");
    // Clear pole selection when selecting a direction
    if (value !== "none") {
      setSelectedPoleId("none");
    }
  };

  const handleServiceChange = (value: string) => {
    setSelectedServiceId(value);
    // Clear pole and direction selections when selecting a service
    if (value !== "none") {
      setSelectedPoleId("none");
      setSelectedDirectionId("none");
    }
  };

  if (isLoadingPoles) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="pole">Pôle</Label>
        <Select 
          value={selectedPoleId} 
          onValueChange={handlePoleChange}
          disabled={selectedDirectionId !== "none" || selectedServiceId !== "none"}
        >
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
          value={selectedDirectionId} 
          onValueChange={handleDirectionChange}
          disabled={selectedServiceId !== "none"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune</SelectItem>
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
          value={selectedServiceId} 
          onValueChange={handleServiceChange}
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
    </div>
  );
};