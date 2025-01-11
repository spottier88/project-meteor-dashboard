import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrganizationSelect } from "./OrganizationSelect";
import { ManagerAssignment } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";

interface AssignmentFormProps {
  userId: string;
  onAssignmentAdded: () => void;
}

export const AssignmentForm = ({ userId, onAssignmentAdded }: AssignmentFormProps) => {
  const { toast } = useToast();
  const [selectedPoleId, setSelectedPoleId] = useState("");
  const [selectedDirectionId, setSelectedDirectionId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const handleAddAssignment = async () => {
    try {
      const assignment: Partial<ManagerAssignment> = {
        user_id: userId,
        pole_id: selectedPoleId || null,
        direction_id: selectedDirectionId || null,
        service_id: selectedServiceId || null,
      };

      const { error } = await supabase
        .from("manager_assignments")
        .insert([assignment]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'affectation a été ajoutée",
      });

      onAssignmentAdded();
      resetForm();
    } catch (error) {
      console.error("Error adding assignment:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'affectation",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedPoleId("");
    setSelectedDirectionId("");
    setSelectedServiceId("");
  };

  const isFormValid = selectedPoleId || selectedDirectionId || selectedServiceId;

  return (
    <div className="space-y-4">
      <OrganizationSelect
        selectedPoleId={selectedPoleId}
        selectedDirectionId={selectedDirectionId}
        selectedServiceId={selectedServiceId}
        onPoleChange={setSelectedPoleId}
        onDirectionChange={setSelectedDirectionId}
        onServiceChange={setSelectedServiceId}
      />

      <Button 
        onClick={handleAddAssignment}
        disabled={!isFormValid}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter l'affectation
      </Button>
    </div>
  );
};