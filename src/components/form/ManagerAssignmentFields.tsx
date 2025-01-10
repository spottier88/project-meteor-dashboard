import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerAssignment } from "@/types/user";

interface ManagerAssignmentFieldsProps {
  userId: string;
  onAssignmentChange: (assignments: ManagerAssignment[]) => void;
}

export const ManagerAssignmentFields = ({ userId, onAssignmentChange }: ManagerAssignmentFieldsProps) => {
  const [assignments, setAssignments] = useState<ManagerAssignment[]>([]);

  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("directions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingAssignments } = useQuery({
    queryKey: ["managerAssignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_assignments")
        .select("*, poles(*), directions(*), services(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return data as ManagerAssignment[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (existingAssignments) {
      setAssignments(existingAssignments);
      onAssignmentChange(existingAssignments);
    }
  }, [existingAssignments, onAssignmentChange]);

  const handleAddAssignment = (type: "pole" | "direction" | "service", id: string) => {
    const newAssignment: Partial<ManagerAssignment> = {
      user_id: userId,
    };

    if (type === "pole") newAssignment.pole_id = id;
    if (type === "direction") newAssignment.direction_id = id;
    if (type === "service") newAssignment.service_id = id;

    const updatedAssignments = [...assignments, newAssignment as ManagerAssignment];
    setAssignments(updatedAssignments);
    onAssignmentChange(updatedAssignments);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Pôles gérés</Label>
        <Select
          onValueChange={(value) => handleAddAssignment("pole", value)}
        >
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

      <div>
        <Label>Directions gérées</Label>
        <Select
          onValueChange={(value) => handleAddAssignment("direction", value)}
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

      <div>
        <Label>Services gérés</Label>
        <Select
          onValueChange={(value) => handleAddAssignment("service", value)}
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

      {assignments.length > 0 && (
        <div className="mt-4">
          <Label>Assignations actuelles</Label>
          <ul className="mt-2 space-y-2">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="text-sm text-gray-600">
                {assignment.poles?.name || assignment.directions?.name || assignment.services?.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};