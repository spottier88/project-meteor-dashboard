import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { UserProfile } from "@/types/user";
import { Label } from "@/components/ui/label";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";

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