import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerAssignment } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ManagerAssignmentFieldsProps {
  userId: string;
  onAssignmentChange: (assignments: Omit<ManagerAssignment, 'id' | 'created_at'>[]) => void;
}

export const ManagerAssignmentFields = ({ userId, onAssignmentChange }: ManagerAssignmentFieldsProps) => {
  const { toast } = useToast();
  const [selectedPoleId, setSelectedPoleId] = useState<string>("none");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("none");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");
  const [existingAssignments, setExistingAssignments] = useState<ManagerAssignment[]>([]);

  // Fetch existing assignments
  const { data: assignments, refetch: refetchAssignments } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_assignments")
        .select(`
          id,
          pole_id,
          direction_id,
          service_id,
          poles (id, name),
          directions (id, name),
          services (id, name)
        `)
        .eq("user_id", userId);
      if (error) throw error;
      return data as ManagerAssignment[];
    },
  });

  useEffect(() => {
    if (assignments) {
      setExistingAssignments(assignments);
    }
  }, [assignments]);

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

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("manager_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'affectation a été supprimée",
      });

      refetchAssignments();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  // Effect to update assignments when selections change
  useEffect(() => {
    const newAssignments: Omit<ManagerAssignment, 'id' | 'created_at'>[] = [];
    
    if (selectedPoleId !== "none") {
      newAssignments.push({
        user_id: userId,
        pole_id: selectedPoleId,
        direction_id: null,
        service_id: null,
      });
    }
    
    if (selectedDirectionId !== "none") {
      newAssignments.push({
        user_id: userId,
        pole_id: null,
        direction_id: selectedDirectionId,
        service_id: null,
      });
    }
    
    if (selectedServiceId !== "none") {
      newAssignments.push({
        user_id: userId,
        pole_id: null,
        direction_id: null,
        service_id: selectedServiceId,
      });
    }

    onAssignmentChange(newAssignments);
  }, [selectedPoleId, selectedDirectionId, selectedServiceId, userId, onAssignmentChange]);

  const handlePoleChange = (value: string) => {
    setSelectedPoleId(value);
    setSelectedDirectionId("none");
    setSelectedServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    setSelectedDirectionId(value);
    setSelectedServiceId("none");
  };

  if (isLoadingPoles) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-4">
        <Label>Affectations existantes</Label>
        {existingAssignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span>
              {assignment.poles?.name || assignment.directions?.name || assignment.services?.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteAssignment(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pole">Pôle</Label>
        <Select value={selectedPoleId} onValueChange={handlePoleChange}>
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
          disabled={!selectedPoleId || selectedPoleId === "none"}
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
          onValueChange={setSelectedServiceId}
          disabled={!selectedDirectionId || selectedDirectionId === "none"}
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