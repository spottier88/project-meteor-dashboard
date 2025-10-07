import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserProfile } from "@/types/user";

interface ProjectManagerComboboxProps {
  value: string;
  onChange: (value: string) => void;
  projectManagers: UserProfile[];
}

/**
 * Composant de sélection du chef de projet avec recherche
 * Permet de rechercher et sélectionner un chef de projet parmi la liste disponible
 */
export const ProjectManagerCombobox = ({
  value,
  onChange,
  projectManagers,
}: ProjectManagerComboboxProps) => {
  const [open, setOpen] = useState(false);

  // Trouver le manager sélectionné
  const selectedManager = projectManagers.find((m) => m.email === value);

  // Formater le nom complet d'un manager
  const getManagerDisplayName = (manager: UserProfile) => {
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || "";
  };

  // Formater le texte de recherche (nom + email)
  const getManagerSearchText = (manager: UserProfile) => {
    const name = getManagerDisplayName(manager);
    return `${name} ${manager.email}`.toLowerCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedManager ? (
            <span className="truncate">
              {getManagerDisplayName(selectedManager)}
              <span className="text-muted-foreground ml-2">
                ({selectedManager.email})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Rechercher un chef de projet...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un chef de projet..." />
          <CommandList>
            <CommandEmpty>Aucun chef de projet trouvé.</CommandEmpty>
            <CommandGroup>
              {projectManagers.map((manager) => (
                <CommandItem
                  key={manager.id}
                  value={getManagerSearchText(manager)}
                  onSelect={() => {
                    onChange(manager.email || "");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === manager.email ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{getManagerDisplayName(manager)}</span>
                    <span className="text-xs text-muted-foreground">
                      {manager.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
