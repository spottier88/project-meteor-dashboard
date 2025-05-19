
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organization {
  pole: string | null;
  direction: string | null;
  service: string | null;
  pole_name?: string;
  direction_name?: string;
  service_name?: string;
}

interface OrganizationAutocompleteProps {
  organization: Organization;
  setOrganization: (org: Organization) => void;
  disabled?: boolean;
}

interface OrganizationOption {
  value: string;
  label: string;
  organization: Organization;
}

export const OrganizationAutocomplete: React.FC<OrganizationAutocompleteProps> = ({
  organization,
  setOrganization,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OrganizationOption[]>([]);
  const [value, setValue] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });
  
  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, name, pole_id")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });
  
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, direction_id")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  // Construire les options de sélection avec la hiérarchie complète
  useEffect(() => {
    if (poles && directions && services) {
      const organizationOptions: OrganizationOption[] = [];
      
      // Ajouter les pôles
      poles.forEach(pole => {
        organizationOptions.push({
          value: `pole-${pole.id}`,
          label: pole.name,
          organization: { pole: pole.id, direction: null, service: null, pole_name: pole.name }
        });
        
        // Ajouter les directions de ce pôle
        const poleDirections = directions.filter(dir => dir.pole_id === pole.id);
        poleDirections.forEach(direction => {
          organizationOptions.push({
            value: `direction-${direction.id}`,
            label: `${pole.name} > ${direction.name}`,
            organization: { 
              pole: pole.id, 
              direction: direction.id, 
              service: null,
              pole_name: pole.name,
              direction_name: direction.name
            }
          });
          
          // Ajouter les services de cette direction
          const directionServices = services.filter(srv => srv.direction_id === direction.id);
          directionServices.forEach(service => {
            organizationOptions.push({
              value: `service-${service.id}`,
              label: `${pole.name} > ${direction.name} > ${service.name}`,
              organization: { 
                pole: pole.id, 
                direction: direction.id, 
                service: service.id,
                pole_name: pole.name,
                direction_name: direction.name,
                service_name: service.name
              }
            });
          });
        });
      });
      
      setOptions(organizationOptions);
    }
  }, [poles, directions, services]);

  // Déterminer la valeur affichée initiale en fonction de l'organisation sélectionnée
  useEffect(() => {
    if (organization && options.length > 0) {
      const selectedOption = options.find(opt => {
        if (organization.service) {
          return opt.organization.service === organization.service;
        } else if (organization.direction) {
          return opt.organization.direction === organization.direction && !opt.organization.service;
        } else if (organization.pole) {
          return opt.organization.pole === organization.pole && !opt.organization.direction;
        }
        return false;
      });
      
      if (selectedOption) {
        setValue(selectedOption.value);
        setDisplayValue(selectedOption.label);
      } else {
        setValue("");
        setDisplayValue("");
      }
    }
  }, [organization, options]);

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(opt => opt.value === currentValue);
    
    if (selectedOption) {
      setOrganization(selectedOption.organization);
      setValue(currentValue);
      setDisplayValue(selectedOption.label);
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayValue || "Sélectionner une organisation"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une organisation..." />
          <CommandEmpty>Aucune organisation trouvée.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
