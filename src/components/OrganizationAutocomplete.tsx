
import React, { useState, useEffect } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationAutocompleteProps {
  organization: any;
  setOrganization: (value: any) => void;
  disabled?: boolean;
}

export const OrganizationAutocomplete: React.FC<OrganizationAutocompleteProps> = ({
  organization,
  setOrganization,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  // Requête pour récupérer les pôles
  const { data: poles, isLoading: polesLoading } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !disabled,
  });

  // Requête pour récupérer les directions
  const { data: directions, isLoading: directionsLoading } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*, poles(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !disabled,
  });

  // Requête pour récupérer les services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, directions(name, poles(name))")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !disabled,
  });

  // Mettre à jour l'organisation sélectionnée lorsque les données sont chargées
  useEffect(() => {
    if (!organization) return;
    
    // Formater l'affichage de l'organisation sélectionnée
    if (organization.service) {
      const service = services?.find(s => s.id === organization.service);
      if (service) {
        setSelectedOrg({
          id: service.id,
          name: `${service.directions.poles.name} > ${service.directions.name} > ${service.name}`,
          type: "service"
        });
      }
    } else if (organization.direction) {
      const direction = directions?.find(d => d.id === organization.direction);
      if (direction) {
        setSelectedOrg({
          id: direction.id,
          name: `${direction.poles.name} > ${direction.name}`,
          type: "direction"
        });
      }
    } else if (organization.pole) {
      const pole = poles?.find(p => p.id === organization.pole);
      if (pole) {
        setSelectedOrg({
          id: pole.id,
          name: pole.name,
          type: "pole"
        });
      }
    }
  }, [organization, poles, directions, services]);

  // Construire la liste complète des options
  const allOptions = [
    ...(poles || []).map(pole => ({
      id: pole.id,
      name: pole.name,
      type: "pole"
    })),
    ...(directions || []).map(direction => ({
      id: direction.id,
      name: `${direction.poles.name} > ${direction.name}`,
      type: "direction"
    })),
    ...(services || []).map(service => ({
      id: service.id,
      name: `${service.directions.poles.name} > ${service.directions.name} > ${service.name}`,
      type: "service"
    }))
  ];

  const handleSelect = (value: any) => {
    const option = allOptions.find(opt => opt.id === value);
    if (!option) return;

    setSelectedOrg(option);
    
    // Mettre à jour l'objet organization selon le type sélectionné
    if (option.type === "pole") {
      setOrganization({
        pole: option.id,
        direction: null,
        service: null
      });
    } else if (option.type === "direction") {
      // Trouver le pôle parent
      const direction = directions?.find(d => d.id === option.id);
      setOrganization({
        pole: direction?.pole_id,
        direction: option.id,
        service: null
      });
    } else if (option.type === "service") {
      // Trouver la direction et le pôle parents
      const service = services?.find(s => s.id === option.id);
      const direction = directions?.find(d => d.id === service?.direction_id);
      setOrganization({
        pole: direction?.pole_id,
        direction: service?.direction_id,
        service: option.id
      });
    }

    setOpen(false);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedOrg ? selectedOrg.name : "Sélectionner une organisation..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une organisation..." />
          <CommandList>
            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
            <CommandGroup>
              {allOptions.map((option) => (
                <CommandItem
                  key={`${option.type}-${option.id}`}
                  onSelect={() => handleSelect(option.id)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrg?.id === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
