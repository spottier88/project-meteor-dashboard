import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface OrganizationFieldsProps {
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
  initialPoleId?: string | null;
  initialDirectionId?: string | null;
  initialServiceId?: string | null;
}

export const OrganizationFields = ({
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
  initialPoleId,
  initialDirectionId,
  initialServiceId,
}: OrganizationFieldsProps) => {
  // Fetch poles
  const { data: poles } = useQuery({
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

  // Fetch directions based on selected pole
  const { data: directions } = useQuery({
    queryKey: ["directions", poleId],
    queryFn: async () => {
      if (!poleId || poleId === "none") return [];
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", poleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!poleId && poleId !== "none",
  });

  // Fetch services based on selected direction
  const { data: services } = useQuery({
    queryKey: ["services", directionId],
    queryFn: async () => {
      if (!directionId || directionId === "none") return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", directionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!directionId && directionId !== "none",
  });

  // Initialize pole
  useEffect(() => {
    if (initialPoleId && initialPoleId !== "none") {
      setPoleId(initialPoleId);
    }
  }, [initialPoleId, setPoleId]);

  // Initialize direction once directions are loaded
  useEffect(() => {
    if (initialDirectionId && directions?.some(d => d.id === initialDirectionId)) {
      setDirectionId(initialDirectionId);
    }
  }, [initialDirectionId, directions, setDirectionId]);

  // Initialize service once services are loaded
  useEffect(() => {
    if (initialServiceId && services?.some(s => s.id === initialServiceId)) {
      setServiceId(initialServiceId);
    }
  }, [initialServiceId, services, setServiceId]);

  const handlePoleChange = (value: string) => {
    if (value === poleId) return;
    setPoleId(value);
    setDirectionId("none");
    setServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    if (value === directionId) return;
    setDirectionId(value);
    setServiceId("none");
  };

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
            value={serviceId} 
            onValueChange={setServiceId}
            disabled={!directionId || directionId === "none"}
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
    </div>
  );
};