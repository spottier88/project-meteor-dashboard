import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Scopes {
  access_level: string;
  pole_ids: string[];
  direction_ids: string[];
  service_ids: string[];
  project_ids: string[];
  data_types: string[];
}

interface ScopeSelectorProps {
  scopes: Scopes;
  onChange: (scopes: Scopes) => void;
}

const DATA_TYPES = [
  { value: 'projects', label: 'Projets' },
  { value: 'team', label: 'Équipes' },
  { value: 'tasks', label: 'Tâches' },
  { value: 'risks', label: 'Risques' },
];

export function ScopeSelector({ scopes, onChange }: ScopeSelectorProps) {
  const { data: poles } = useQuery({
    queryKey: ['poles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('poles').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: directions } = useQuery({
    queryKey: ['directions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('directions').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const toggleDataType = (type: string) => {
    const newDataTypes = scopes.data_types.includes(type)
      ? scopes.data_types.filter(t => t !== type)
      : [...scopes.data_types, type];
    onChange({ ...scopes, data_types: newDataTypes });
  };

  const togglePole = (poleId: string) => {
    const newPoleIds = scopes.pole_ids.includes(poleId)
      ? scopes.pole_ids.filter(id => id !== poleId)
      : [...scopes.pole_ids, poleId];
    onChange({ ...scopes, pole_ids: newPoleIds });
  };

  const toggleDirection = (directionId: string) => {
    const newDirectionIds = scopes.direction_ids.includes(directionId)
      ? scopes.direction_ids.filter(id => id !== directionId)
      : [...scopes.direction_ids, directionId];
    onChange({ ...scopes, direction_ids: newDirectionIds });
  };

  const toggleService = (serviceId: string) => {
    const newServiceIds = scopes.service_ids.includes(serviceId)
      ? scopes.service_ids.filter(id => id !== serviceId)
      : [...scopes.service_ids, serviceId];
    onChange({ ...scopes, service_ids: newServiceIds });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Périmètres d'accès</CardTitle>
        <CardDescription>
          Définissez les données accessibles via ce token. Si aucun périmètre n'est sélectionné,
          le token aura accès à toutes les données.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Types de données accessibles *</Label>
          <div className="grid grid-cols-2 gap-3">
            {DATA_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`data-type-${type.value}`}
                  checked={scopes.data_types.includes(type.value)}
                  onCheckedChange={() => toggleDataType(type.value)}
                />
                <Label htmlFor={`data-type-${type.value}`} className="cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">Restriction par organisation (optionnel)</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Laissez vide pour autoriser l'accès à toutes les organisations
            </p>
          </div>

          {poles && poles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Pôles</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {poles.map((pole) => (
                  <div key={pole.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pole-${pole.id}`}
                      checked={scopes.pole_ids.includes(pole.id)}
                      onCheckedChange={() => togglePole(pole.id)}
                    />
                    <Label htmlFor={`pole-${pole.id}`} className="cursor-pointer text-sm">
                      {pole.name}
                    </Label>
                  </div>
                ))}
              </div>
              {scopes.pole_ids.length > 0 && (
                <Badge variant="secondary">{scopes.pole_ids.length} pôle(s) sélectionné(s)</Badge>
              )}
            </div>
          )}

          {directions && directions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Directions</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {directions.map((direction) => (
                  <div key={direction.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`direction-${direction.id}`}
                      checked={scopes.direction_ids.includes(direction.id)}
                      onCheckedChange={() => toggleDirection(direction.id)}
                    />
                    <Label htmlFor={`direction-${direction.id}`} className="cursor-pointer text-sm">
                      {direction.name}
                    </Label>
                  </div>
                ))}
              </div>
              {scopes.direction_ids.length > 0 && (
                <Badge variant="secondary">{scopes.direction_ids.length} direction(s) sélectionnée(s)</Badge>
              )}
            </div>
          )}

          {services && services.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Services</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={scopes.service_ids.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <Label htmlFor={`service-${service.id}`} className="cursor-pointer text-sm">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
              {scopes.service_ids.length > 0 && (
                <Badge variant="secondary">{scopes.service_ids.length} service(s) sélectionné(s)</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
