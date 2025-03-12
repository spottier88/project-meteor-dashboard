
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { UserProfile } from "@/types/user";
import { Label } from "@/components/ui/label";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { CommandInput, CommandEmpty, CommandGroup, CommandItem, Command } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFormStep1Props {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  projectManager: string;
  setProjectManager: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  priority: string;
  setPriority: (value: string) => void;
  lifecycleStatus: ProjectLifecycleStatus;
  setLifecycleStatus: (value: ProjectLifecycleStatus) => void;
  isAdmin: boolean;
  isManager: boolean;
  projectManagers?: UserProfile[];
}

export const ProjectFormStep1 = ({
  title,
  setTitle,
  description,
  setDescription,
  projectManager,
  setProjectManager,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  priority,
  setPriority,
  lifecycleStatus,
  setLifecycleStatus,
  isAdmin,
  isManager,
  projectManagers,
}: ProjectFormStep1Props) => {
  const canEditProjectManager = isAdmin || isManager;
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredManagers, setFilteredManagers] = useState<UserProfile[]>([]);
  const user = useUser();
  
  useEffect(() => {
    // Pré-remplir avec l'email de l'utilisateur actuel si c'est un chef de projet
    // et que le champ est vide (nouveau projet)
    if (user?.email && !projectManager) {
      setProjectManager(user.email);
    }
  }, [user, projectManager, setProjectManager]);

  useEffect(() => {
    if (!projectManagers) return;
    
    // Filtrer les chefs de projet en fonction du terme de recherche
    const filtered = projectManagers.filter(manager => {
      const fullName = `${manager.first_name || ''} ${manager.last_name || ''}`.toLowerCase();
      const email = (manager.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      
      return fullName.includes(term) || email.includes(term);
    });
    
    setFilteredManagers(filtered);
  }, [searchTerm, projectManagers]);

  const getSelectedManagerLabel = () => {
    if (!projectManager) return "Sélectionner un chef de projet";
    
    const selectedManager = projectManagers?.find(m => m.email === projectManager);
    if (selectedManager && selectedManager.first_name && selectedManager.last_name) {
      return `${selectedManager.first_name} ${selectedManager.last_name} (${selectedManager.email})`;
    }
    
    return projectManager;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom du projet"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du projet"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lifecycle-status">Statut du projet</Label>
        <Select value={lifecycleStatus} onValueChange={(value: ProjectLifecycleStatus) => setLifecycleStatus(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(lifecycleStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project-manager">Chef de projet *</Label>
        {canEditProjectManager && projectManagers && projectManagers.length > 0 ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {getSelectedManagerLabel()}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandInput 
                    placeholder="Rechercher un chef de projet..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="h-9 w-full"
                  />
                </div>
                <CommandEmpty>Aucun chef de projet trouvé.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {filteredManagers.map((manager) => (
                    <CommandItem
                      key={manager.id}
                      onSelect={() => {
                        setProjectManager(manager.email || "");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          projectManager === manager.email ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {manager.first_name && manager.last_name
                        ? `${manager.first_name} ${manager.last_name} (${manager.email})`
                        : manager.email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            id="project-manager"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            readOnly={!canEditProjectManager}
            className={!canEditProjectManager ? "bg-gray-100" : ""}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerField
          label="Date de début"
          value={startDate}
          onChange={setStartDate}
        />
        <DatePickerField
          label="Date de fin"
          value={endDate}
          onChange={setEndDate}
          minDate={startDate}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="priority">Priorité</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
