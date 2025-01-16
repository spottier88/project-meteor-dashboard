import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityType, HierarchyAssignment } from "@/types/user";

interface HierarchyAssignmentFieldsProps {
  userId: string;
  onAssignmentChange: (assignment: Omit<HierarchyAssignment, 'id' | 'created_at'>) => void;
}

export const HierarchyAssignmentFields = ({ userId, onAssignmentChange }: HierarchyAssignmentFieldsProps) => {
  const [selectedPoleId, setSelectedPoleId] = useState<string>("none");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("none");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | "none">("none");

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

  useEffect(() => {
    if (selectedEntityType === "none") {
      onAssignmentChange({
        user_id: userId,
        entity_id: "",
        entity_type: "pole"
      });
      return;
    }

    let entityId = "";
    if (selectedEntityType === "pole" && selectedPoleId !== "none") {
      entityId = selectedPoleId;
    } else if (selectedEntityType === "direction" && selectedDirectionId !== "none") {
      entityId = selectedDirectionId;
    } else if (selectedEntityType === "service" && selectedServiceId !== "none") {
      entityId = selectedServiceId;
    }

    if (entityId) {
      onAssignmentChange({
        user_id: userId,
        entity_id: entityId,
        entity_type: selectedEntityType
      });
    }
  }, [selectedEntityType, selectedPoleId, selectedDirectionId, selectedServiceId, userId, onAssignmentChange]);

  const handleEntityTypeChange = (value: string) => {
    setSelectedEntityType(value as EntityType | "none");
    if (value === "none") {
      setSelectedPoleId("none");
      setSelectedDirectionId("none");
      setSelectedServiceId("none");
    }
  };

  if (isLoadingPoles) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="entityType">Niveau hiérarchique</Label>
        <Select value={selectedEntityType} onValueChange={handleEntityTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            <SelectItem value="pole">Pôle</SelectItem>
            <SelectItem value="direction">Direction</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedEntityType !== "none" && (
        <div className="grid gap-2">
          <Label htmlFor="pole">Pôle</Label>
          <Select 
            value={selectedPoleId} 
            onValueChange={(value) => {
              setSelectedPoleId(value);
              setSelectedDirectionId("none");
              setSelectedServiceId("none");
            }}
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
      )}

      {selectedEntityType !== "none" && selectedEntityType !== "pole" && selectedPoleId !== "none" && (
        <div className="grid gap-2">
          <Label htmlFor="direction">Direction</Label>
          <Select 
            value={selectedDirectionId} 
            onValueChange={(value) => {
              setSelectedDirectionId(value);
              setSelectedServiceId("none");
            }}
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
      )}

      {selectedEntityType === "service" && selectedDirectionId !== "none" && (
        <div className="grid gap-2">
          <Label htmlFor="service">Service</Label>
          <Select 
            value={selectedServiceId} 
            onValueChange={setSelectedServiceId}
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
      )}
    </div>
  );
};