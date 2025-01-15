import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { UserProfile } from "@/types/user";
import { MonitoringLevel } from "@/types/monitoring";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BasicProjectFieldsProps {
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
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (value: MonitoringLevel) => void;
  monitoringEntityId: string | null;
  setMonitoringEntityId: (value: string | null) => void;
  isAdmin: boolean;
  projectManagers?: UserProfile[];
  poleId?: string;
  directionId?: string;
}

export const BasicProjectFields = ({
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
  monitoringLevel,
  setMonitoringLevel,
  monitoringEntityId,
  setMonitoringEntityId,
  isAdmin,
  projectManagers,
  poleId,
  directionId,
}: BasicProjectFieldsProps) => {
  console.log("BasicProjectFields - Props:", {
    monitoringLevel,
    monitoringEntityId,
    poleId,
    directionId
  });

  // Fetch poles for monitoring
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      console.log("Poles data:", data);
      return data;
    },
    enabled: monitoringLevel === "pole",
  });

  // Fetch directions for monitoring
  const { data: directions } = useQuery({
    queryKey: ["directions", poleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", poleId)
        .order("name");
      if (error) throw error;
      console.log("Directions data:", data);
      return data;
    },
    enabled: monitoringLevel === "direction" && !!poleId,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Titre *
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom du projet"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du projet"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="project-manager" className="text-sm font-medium">
          Chef de projet *
        </label>
        {isAdmin && projectManagers ? (
          <Select value={projectManager} onValueChange={setProjectManager}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un chef de projet" />
            </SelectTrigger>
            <SelectContent>
              {projectManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.email || ""}>
                  {manager.first_name && manager.last_name
                    ? `${manager.first_name} ${manager.last_name} (${manager.email})`
                    : manager.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="project-manager"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            readOnly={!isAdmin}
            className={!isAdmin ? "bg-gray-100" : ""}
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
        <label htmlFor="priority" className="text-sm font-medium">
          Priorité
        </label>
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
      <div className="grid gap-2">
        <label htmlFor="monitoring-level" className="text-sm font-medium">
          Niveau de suivi
        </label>
        <Select value={monitoringLevel} onValueChange={(value: MonitoringLevel) => {
          console.log("Changing monitoring level to:", value);
          setMonitoringLevel(value);
          setMonitoringEntityId(null);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un niveau de suivi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            <SelectItem value="dgs">DGS</SelectItem>
            <SelectItem value="pole">Pôle</SelectItem>
            <SelectItem value="direction">Direction</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {monitoringLevel !== 'none' && monitoringLevel !== 'dgs' && (
        <div className="grid gap-2">
          <label htmlFor="monitoring-entity" className="text-sm font-medium">
            Entité de suivi
          </label>
          <Select 
            value={monitoringEntityId || ""} 
            onValueChange={(value) => {
              console.log("Setting monitoring entity to:", value);
              setMonitoringEntityId(value || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une entité" />
            </SelectTrigger>
            <SelectContent>
              {monitoringLevel === "pole" && poles?.map((pole) => (
                <SelectItem key={pole.id} value={pole.id}>
                  {pole.name}
                </SelectItem>
              ))}
              {monitoringLevel === "direction" && directions?.map((direction) => (
                <SelectItem key={direction.id} value={direction.id}>
                  {direction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
