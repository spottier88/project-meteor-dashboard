import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/types/user";
import { Label } from "@/components/ui/label";
import { DateInputField } from "./DateInputField";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { useAccessiblePortfolios } from "@/hooks/useAccessiblePortfolios";
import { ProjectManagerCombobox } from "./ProjectManagerCombobox";

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
  portfolioId: string | undefined;
  setPortfolioId: (value: string | undefined) => void;
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
  lifecycleStatus,
  setLifecycleStatus,
  portfolioId,
  setPortfolioId,
  isAdmin,
  isManager = false,
  projectManagers,
}: BasicProjectFieldsProps) => {
  const canEditProjectManager = Boolean(isAdmin) || Boolean(isManager);
  
  // Récupérer les portefeuilles accessibles
  const { data: accessiblePortfolios, isLoading: portfoliosLoading } = useAccessiblePortfolios();

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
            {Object.entries(lifecycleStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="portfolio" className="text-sm font-medium">
          Portefeuille
        </label>
        <Select 
          value={portfolioId || "none"} 
          onValueChange={(value) => setPortfolioId(value === "none" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un portefeuille (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun portefeuille</SelectItem>
            {portfoliosLoading ? (
              <SelectItem value="loading" disabled>Chargement...</SelectItem>
            ) : (
              accessiblePortfolios?.map((portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                  {portfolio.status && portfolio.status !== 'actif' && (
                    <span className="text-muted-foreground ml-2">({portfolio.status})</span>
                  )}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="project-manager" className="text-sm font-medium">
          Chef de projet *
        </label>
        {canEditProjectManager && projectManagers ? (
          <ProjectManagerCombobox
            value={projectManager}
            onChange={setProjectManager}
            projectManagers={projectManagers}
          />
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
