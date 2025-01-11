import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationSelectProps {
  selectedPoleId: string;
  selectedDirectionId: string;
  selectedServiceId: string;
  onPoleChange: (value: string) => void;
  onDirectionChange: (value: string) => void;
  onServiceChange: (value: string) => void;
}

export const OrganizationSelect = ({
  selectedPoleId,
  selectedDirectionId,
  selectedServiceId,
  onPoleChange,
  onDirectionChange,
  onServiceChange,
}: OrganizationSelectProps) => {
  // Fetch poles
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

  // Fetch directions for selected pole
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

  // Fetch services for selected direction
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

  const handlePoleChange = (value: string) => {
    onPoleChange(value);
    onDirectionChange("");
    onServiceChange("");
  };

  const handleDirectionChange = (value: string) => {
    onDirectionChange(value);
    onServiceChange("");
  };

  if (isLoadingPoles) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Pôle</Label>
        <Select value={selectedPoleId} onValueChange={handlePoleChange}>
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
          onValueChange={handleDirectionChange}
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
          onValueChange={onServiceChange}
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
    </div>
  );
};