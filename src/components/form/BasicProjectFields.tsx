import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { Switch } from "@/components/ui/switch";
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
  suiviDgs: boolean;
  setSuiviDgs: (value: boolean) => void;
  isAdmin: boolean;
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
  suiviDgs,
  setSuiviDgs,
  isAdmin,
}: BasicProjectFieldsProps) => {
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
        <Input
          id="project-manager"
          value={projectManager}
          onChange={(e) => setProjectManager(e.target.value)}
          readOnly={!isAdmin}
          className={!isAdmin ? "bg-gray-100" : ""}
        />
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
      <div className="flex items-center space-x-2">
        <Switch
          id="suivi-dgs"
          checked={suiviDgs}
          onCheckedChange={setSuiviDgs}
        />
        <Label htmlFor="suivi-dgs">Suivi DGS</Label>
      </div>
    </div>
  );
};