
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "./DatePicker";
import { UserProfile } from "@/types/user";
import { MonitoringLevel } from "@/types/monitoring";
import { Label } from "@/components/ui/label";

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
  isManager?: boolean;
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
  isAdmin,
  isManager,
  projectManagers,
  poleId,
  directionId,
}: BasicProjectFieldsProps) => {
  const canEditProjectManager = isAdmin || isManager;

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
        {canEditProjectManager && projectManagers ? (
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
            readOnly={!canEditProjectManager}
            className={!canEditProjectManager ? "bg-gray-100" : ""}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="Date de début"
          date={startDate}
          onDateChange={setStartDate}
        />
        <DatePicker
          label="Date de fin"
          date={endDate}
          onDateChange={setEndDate}
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
        <Label htmlFor="monitoring-level" className="text-sm font-medium">
          Niveau de suivi
        </Label>
        <Select 
          value={monitoringLevel} 
          onValueChange={(value: MonitoringLevel) => {
            setMonitoringLevel(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un niveau de suivi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            <SelectItem value="dgs">DGS</SelectItem>
            <SelectItem value="pole" disabled={!poleId}>Pôle</SelectItem>
            <SelectItem value="direction" disabled={!directionId}>Direction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {monitoringLevel === 'pole' && poleId && (
        <div className="grid gap-2">
          <Label className="text-sm font-medium">
            Entité de suivi
          </Label>
          <Input
            value="Pôle du projet"
            readOnly
            className="bg-gray-100"
          />
        </div>
      )}

      {monitoringLevel === 'direction' && directionId && (
        <div className="grid gap-2">
          <Label className="text-sm font-medium">
            Entité de suivi
          </Label>
          <Input
            value="Direction du projet"
            readOnly
            className="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
};
