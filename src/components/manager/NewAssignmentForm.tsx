import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerAssignment } from "@/types/user";

interface NewAssignmentFormProps {
  userId: string;
  onAssignmentAdd: (assignment: Omit<ManagerAssignment, 'id' | 'created_at'>) => void;
}

export const NewAssignmentForm = ({ userId, onAssignmentAdd }: NewAssignmentFormProps) => {
  const [selectedPoleId, setSelectedPoleId] = useState<string>("");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

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
  const { data: directions } = useQuery({
    queryKey: ["directions", selectedPoleId],
    queryFn: async () => {
      if (!selectedPoleId) return [];
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", selectedPoleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPoleId,
  });

  // Fetch services data filtered by direction
  const { data: services } = useQuery({
    queryKey: ["services", selectedDirectionId],
    queryFn: async () => {
      if (!selectedDirectionId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", selectedDirectionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDirectionId,
  });

  const handleAddAssignment = () => {
    const assignment: Omit<ManagerAssignment, 'id' | 'created_at'> = {
      user_id: userId,
      pole_id: selectedPoleId || null,
      direction_id: selectedDirectionId || null,
      service_id: selectedServiceId || null,
    };
    onAssignmentAdd(assignment);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPoleId("");
    setSelectedDirectionId("");
    setSelectedServiceId("");
  };

  if (isLoadingPoles) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle affectation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Pôle</Label>
            <Select value={selectedPoleId} onValueChange={setSelectedPoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pôle" />
              </SelectTrigger>
              <SelectContent>
                {poles?.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Direction</Label>
            <Select 
              value={selectedDirectionId} 
              onValueChange={setSelectedDirectionId}
              disabled={!selectedPoleId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une direction" />
              </SelectTrigger>
              <SelectContent>
                {directions?.map((direction) => (
                  <SelectItem key={direction.id} value={direction.id}>
                    {direction.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Service</Label>
            <Select 
              value={selectedServiceId} 
              onValueChange={setSelectedServiceId}
              disabled={!selectedDirectionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddAssignment}
            disabled={!selectedPoleId && !selectedDirectionId && !selectedServiceId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter l'affectation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};