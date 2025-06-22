
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/types/user";
import { DatePickerField } from "./DatePickerField";
import { ProjectLifecycleStatus } from "@/types/project";

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
  lifecycleStatus: ProjectLifecycleStatus;
  setLifecycleStatus: (value: ProjectLifecycleStatus) => void;
  isAdmin: boolean;
  isManager: boolean;
  projectManagers?: UserProfile[];
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
  lifecycleStatus,
  setLifecycleStatus,
  isAdmin,
  isManager,
  projectManagers
}: BasicProjectFieldsProps) => {
  
  console.log("BasicProjectFields render - projectManagers:", {
    available: !!projectManagers,
    count: projectManagers?.length || 0,
    data: projectManagers
  });
  
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="title">Titre du projet *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entrez le titre du projet"
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
        <Label htmlFor="projectManager">Chef de projet *</Label>
        <Select value={projectManager} onValueChange={setProjectManager}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un chef de projet" />
          </SelectTrigger>
          <SelectContent>
            {projectManagers === undefined ? (
              <SelectItem value="loading" disabled>
                Chargement des chefs de projet...
              </SelectItem>
            ) : projectManagers.length === 0 ? (
              <SelectItem value="empty" disabled>
                Aucun chef de projet disponible
              </SelectItem>
            ) : (
              projectManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.email || ""}>
                  {manager.first_name && manager.last_name 
                    ? `${manager.first_name} ${manager.last_name}` 
                    : manager.email}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DatePickerField
          label="Date de début"
          value={startDate}
          onChange={setStartDate}
        />
        <DatePickerField
          label="Date de fin"
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="priority">Priorité</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lifecycleStatus">Statut du cycle de vie</Label>
        <Select value={lifecycleStatus} onValueChange={(value) => setLifecycleStatus(value as ProjectLifecycleStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idea">Idée</SelectItem>
            <SelectItem value="conception">Conception</SelectItem>
            <SelectItem value="development">Développement</SelectItem>
            <SelectItem value="testing">Test</SelectItem>
            <SelectItem value="deployment">Déploiement</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
