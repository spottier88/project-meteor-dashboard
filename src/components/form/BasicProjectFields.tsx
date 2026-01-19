import { useState } from "react";
import { ChevronsUpDown, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/user";
import { DateInputField } from "./DateInputField";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { ProjectManagerDialog } from "./ProjectManagerDialog";
import { PortfolioMultiSelect } from "./PortfolioMultiSelect";
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
  // Support multi-portefeuilles
  portfolioIds: string[];
  setPortfolioIds: (value: string[]) => void;
  isAdmin: boolean;
  isManager?: boolean;
  projectManagers?: UserProfile[];
  // Lien vers l'équipe Microsoft Teams
  teamsUrl: string;
  setTeamsUrl: (value: string) => void;
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
  portfolioIds,
  setPortfolioIds,
  isAdmin,
  isManager = false,
  projectManagers,
  teamsUrl,
  setTeamsUrl,
}: BasicProjectFieldsProps) => {
  const canEditProjectManager = Boolean(isAdmin) || Boolean(isManager);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);

  // Trouver le manager sélectionné pour afficher son nom
  const selectedManager = projectManagers?.find((m) => m.email === projectManager);
  
  const getManagerDisplayName = (manager: UserProfile | undefined) => {
    if (!manager) return "";
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || "";
  };

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
        <label htmlFor="lifecycle-status" className="text-sm font-medium">
          Statut
        </label>
        <Select value={lifecycleStatus} onValueChange={setLifecycleStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
            {/* Exclure le statut "Terminé" - passage obligatoire par le processus de clôture */}
            {Object.entries(lifecycleStatusLabels)
              .filter(([value]) => value !== 'completed')
              .map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="portfolio" className="text-sm font-medium">
          Portefeuilles
        </label>
        <PortfolioMultiSelect
          selectedPortfolioIds={portfolioIds}
          onChange={setPortfolioIds}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="project-manager" className="text-sm font-medium">
          Chef de projet *
        </label>
        {canEditProjectManager && projectManagers ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManagerDialogOpen(true)}
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
                  Sélectionner un chef de projet...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <ProjectManagerDialog
              isOpen={isManagerDialogOpen}
              onClose={() => setIsManagerDialogOpen(false)}
              value={projectManager}
              onChange={setProjectManager}
              projectManagers={projectManagers}
            />
          </>
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

      {/* Lien vers l'équipe Microsoft Teams */}
      <div className="grid gap-2">
        <label htmlFor="teams-url" className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Lien équipe Teams
        </label>
        <Input
          id="teams-url"
          type="url"
          value={teamsUrl}
          onChange={(e) => setTeamsUrl(e.target.value)}
          placeholder="https://teams.microsoft.com/l/team/..."
        />
        <p className="text-xs text-muted-foreground">
          URL de l'équipe Microsoft Teams associée au projet (optionnel)
        </p>
      </div>
    </div>
  );
};
