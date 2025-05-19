
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFormStep4Props {
  forEntity: {
    type: string | null;
    id: string | null;
  };
  setForEntity: (entity: { type: string | null; id: string | null }) => void;
  suiviDGS: boolean;
  setSuiviDGS: (value: boolean) => void;
  project?: any;
}

export const ProjectFormStep4: React.FC<ProjectFormStep4Props> = ({
  forEntity,
  setForEntity,
  suiviDGS,
  setSuiviDGS,
  project
}) => {
  // Requête pour récupérer les pôles
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

  // Requête pour récupérer les directions
  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*, poles(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Requête pour récupérer les services
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, directions(name, poles(name))")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const selectedEntityOptions = () => {
    if (forEntity.type === "pole") {
      return poles?.map(pole => (
        <SelectItem key={pole.id} value={pole.id}>{pole.name}</SelectItem>
      ));
    } else if (forEntity.type === "direction") {
      return directions?.map(direction => (
        <SelectItem key={direction.id} value={direction.id}>
          {direction.poles?.name} &gt; {direction.name}
        </SelectItem>
      ));
    } else if (forEntity.type === "service") {
      return services?.map(service => (
        <SelectItem key={service.id} value={service.id}>
          {service.directions?.poles?.name} &gt; {service.directions?.name} &gt; {service.name}
        </SelectItem>
      ));
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="for-entity-type">Pour quelle entité</Label>
          <Select 
            value={forEntity.type || ""} 
            onValueChange={(value) => setForEntity({ 
              type: value || null, 
              id: null 
            })}
          >
            <SelectTrigger id="for-entity-type">
              <SelectValue placeholder="Sélectionner un type d'entité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucune</SelectItem>
              <SelectItem value="pole">Pôle</SelectItem>
              <SelectItem value="direction">Direction</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {forEntity.type && (
          <div className="space-y-2">
            <Label htmlFor="for-entity-id">Sélectionner l'entité</Label>
            <Select 
              value={forEntity.id || ""} 
              onValueChange={(value) => setForEntity({ 
                ...forEntity, 
                id: value || null 
              })}
            >
              <SelectTrigger id="for-entity-id">
                <SelectValue placeholder="Sélectionner l'entité" />
              </SelectTrigger>
              <SelectContent>
                {selectedEntityOptions()}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-4">
          <Switch 
            id="suiviDGS" 
            checked={suiviDGS}
            onCheckedChange={setSuiviDGS}
          />
          <Label htmlFor="suiviDGS">Suivi DGS</Label>
        </div>
      </div>
    </div>
  );
};
