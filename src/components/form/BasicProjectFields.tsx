
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/types/user";
import { Label } from "@/components/ui/label";
import { DateInputField } from "./DateInputField";

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
  isAdmin: boolean;
  isManager?: boolean;
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
  isAdmin,
  isManager = false,
  projectManagers,
}: BasicProjectFieldsProps) => {
  // CORRECTION DU BUG: Forcer canEditProjectManager à true si l'utilisateur est admin
  // Ajouter un log pour vérifier les valeurs
  console.log("BasicProjectFields - permissions before fix:", {
    isAdmin,
    isManager, 
    canEditProjectManagerBefore: isAdmin || isManager
  });
  
  // S'assurer que isAdmin est bien considéré comme un booléen
  const canEditProjectManager = Boolean(isAdmin) || Boolean(isManager);
  
  // Log après correction
  console.log("BasicProjectFields - permissions after fix:", {
    isAdmin: Boolean(isAdmin),
    isManager: Boolean(isManager),
    canEditProjectManagerAfter: canEditProjectManager
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
        <DateInputField
          label="Date de début"
          date={startDate}
          onDateChange={setStartDate}
        />
        <DateInputField
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
    </div>
  );
};
