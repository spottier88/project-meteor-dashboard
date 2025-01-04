import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterToggle } from "./FilterToggle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFiltersProps {
  onFilterChange: (filters: {
    showDgsOnly: boolean;
    organization: { type: string; id: string } | null;
    projectManager: string | null;
  }) => void;
}

export const ProjectFilters = ({ onFilterChange }: ProjectFiltersProps) => {
  const [showDgsOnly, setShowDgsOnly] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<{ type: string; id: string } | null>(null);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data } = await supabase.from("poles").select("*");
      return data || [];
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data } = await supabase.from("directions").select("*");
      return data || [];
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*");
      return data || [];
    },
  });

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("project_manager")
        .not("project_manager", "is", null);
      
      if (!data) return [];
      
      // Get unique project managers
      const uniqueManagers = [...new Set(data.map(p => p.project_manager))];
      return uniqueManagers.filter(Boolean);
    },
  });

  useEffect(() => {
    onFilterChange({
      showDgsOnly,
      organization: selectedOrg,
      projectManager: selectedManager,
    });
  }, [showDgsOnly, selectedOrg, selectedManager, onFilterChange]);

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <FilterToggle
          showDgsOnly={showDgsOnly}
          onToggle={(checked) => setShowDgsOnly(checked)}
        />
        
        <Select
          value={selectedOrg ? `${selectedOrg.type}-${selectedOrg.id}` : ""}
          onValueChange={(value) => {
            if (value === "") {
              setSelectedOrg(null);
            } else {
              const [type, id] = value.split("-");
              setSelectedOrg({ type, id });
            }
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrer par organisation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les organisations</SelectItem>
            {poles?.map((pole) => (
              <SelectItem key={pole.id} value={`pole-${pole.id}`}>
                Pôle: {pole.name}
              </SelectItem>
            ))}
            {directions?.map((direction) => (
              <SelectItem key={direction.id} value={`direction-${direction.id}`}>
                Direction: {direction.name}
              </SelectItem>
            ))}
            {services?.map((service) => (
              <SelectItem key={service.id} value={`service-${service.id}`}>
                Service: {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedManager || ""}
          onValueChange={(value) => setSelectedManager(value || null)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrer par chef de projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les chefs de projet</SelectItem>
            {projectManagers?.map((manager) => (
              <SelectItem key={manager} value={manager}>
                {manager}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};