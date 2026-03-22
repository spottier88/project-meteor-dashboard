/**
 * Conteneur principal du wizard "Mode Assisté".
 * Gère la navigation entre les micro-étapes et rend le contenu
 * approprié pour chaque étape en réutilisant les composants existants.
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectFormState } from "../useProjectFormState";
import { AssistedStep } from "./AssistedStep";
import { AssistedRecap } from "./AssistedRecap";
import { ASSISTED_STEPS } from "./AssistedStepConfig";
import { DateInputField } from "../DateInputField";
import { LifecycleStatusButtons } from "@/components/project/LifecycleStatusButtons";
import { PortfolioMultiSelect } from "../PortfolioMultiSelect";
import { ProjectTagsInput } from "@/components/project/ProjectTagsInput";
import { ProjectFormStep2 } from "../ProjectFormStep2";
import { ProjectFormStep3 } from "../ProjectFormStep3";
import { ProjectFormStep4 } from "../ProjectFormStep4";
import { ProjectFormStep5 } from "../ProjectFormStep5";
import { ProjectManagerDialog } from "../ProjectManagerDialog";
import { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Users } from "lucide-react";

interface AssistedProjectWizardProps {
  formState: ProjectFormState;
  projectManagers?: UserProfile[];
  project?: any;
  isEditMode: boolean;
  isAdmin: boolean;
  isManager: boolean;
  /** Callback pour soumettre le formulaire (appelé depuis le récapitulatif) */
  onSubmit: () => void;
}

export const AssistedProjectWizard = ({
  formState,
  projectManagers = [],
  project,
  isEditMode,
  isAdmin,
  isManager,
  onSubmit,
}: AssistedProjectWizardProps) => {
  /** Étape courante du wizard (indépendante du currentStep classique) */
  const [assistedStep, setAssistedStep] = useState(0);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);

  const currentConfig = ASSISTED_STEPS[assistedStep];

  const goNext = useCallback(() => {
    if (assistedStep < ASSISTED_STEPS.length - 1) {
      setAssistedStep(assistedStep + 1);
    }
  }, [assistedStep]);

  const goPrevious = useCallback(() => {
    if (assistedStep > 0) {
      setAssistedStep(assistedStep - 1);
    }
  }, [assistedStep]);

  const goToStep = useCallback((step: number) => {
    setAssistedStep(step);
  }, []);

  /** Vérifie si le bouton Suivant peut être cliqué pour l'étape courante */
  const canGoNext = (): boolean => {
    switch (assistedStep) {
      case 0: return !!formState.title;
      case 1: return !!formState.projectManager;
      default: return true;
    }
  };

  const canEditProjectManager = Boolean(isAdmin) || Boolean(isManager);
  const selectedManager = projectManagers?.find((m) => m.email === formState.projectManager);
  const getManagerDisplayName = (manager: UserProfile | undefined) => {
    if (!manager) return "";
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || "";
  };

  /** Rendu du contenu pour chaque micro-étape */
  const renderStepContent = () => {
    switch (assistedStep) {
      // Étape 0 : Titre + Description
      case 0:
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid gap-2">
              <label htmlFor="assisted-title" className="text-sm font-medium">
                Titre du projet *
              </label>
              <Input
                id="assisted-title"
                value={formState.title}
                onChange={(e) => formState.setTitle(e.target.value)}
                placeholder="Nom du projet"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="assisted-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="assisted-description"
                value={formState.description}
                onChange={(e) => formState.setDescription(e.target.value)}
                placeholder="Décrivez brièvement votre projet..."
                rows={4}
              />
            </div>
          </div>
        );

      // Étape 1 : Chef de projet
      case 1:
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Chef de projet *</label>
              {canEditProjectManager && projectManagers.length > 0 ? (
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
                    value={formState.projectManager}
                    onChange={formState.setProjectManager}
                    projectManagers={projectManagers}
                  />
                </>
              ) : (
                <Input
                  value={formState.projectManager}
                  onChange={(e) => formState.setProjectManager(e.target.value)}
                  readOnly={!canEditProjectManager}
                  className={!canEditProjectManager ? "bg-muted" : ""}
                />
              )}
            </div>
          </div>
        );

      // Étape 2 : Dates
      case 2:
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <DateInputField
              label="Date de début"
              date={formState.startDate}
              onDateChange={formState.setStartDate}
            />
            <DateInputField
              label="Date de fin"
              date={formState.endDate}
              onDateChange={formState.setEndDate}
              minDate={formState.startDate}
            />
          </div>
        );

      // Étape 3 : Statut + Priorité
      case 3:
        return (
          <div className="space-y-6 max-w-md mx-auto">
            <LifecycleStatusButtons
              status={formState.lifecycleStatus}
              onStatusChange={formState.setLifecycleStatus}
            />
            <div className="grid gap-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={formState.priority} onValueChange={formState.setPriority}>
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

      // Étape 4 : Portefeuilles, tags, Teams
      case 4:
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Portefeuilles</label>
              <PortfolioMultiSelect
                selectedPortfolioIds={formState.portfolioIds}
                onChange={formState.setPortfolioIds}
              />
            </div>
            <ProjectTagsInput tags={formState.tags} onChange={formState.setTags} />
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lien équipe Teams / Sharepoint
              </label>
              <Input
                type="url"
                value={formState.teamsUrl}
                onChange={(e) => formState.setTeamsUrl(e.target.value)}
                placeholder="https://teams.microsoft.com/..."
              />
            </div>
          </div>
        );

      // Étape 5 : Niveau de suivi (réutilise ProjectFormStep2)
      case 5:
        return (
          <ProjectFormStep2
            monitoringLevel={formState.monitoringLevel}
            setMonitoringLevel={formState.setMonitoringLevel}
            monitoringEntityId={formState.monitoringEntityId}
            setMonitoringEntityId={formState.setMonitoringEntityId}
            projectManagerOrganization={formState.projectManagerOrganization}
            project={project}
          />
        );

      // Étape 6 : Innovation (réutilise ProjectFormStep3)
      case 6:
        return (
          <ProjectFormStep3
            novateur={formState.novateur}
            setNovateur={formState.setNovateur}
            usager={formState.usager}
            setUsager={formState.setUsager}
            ouverture={formState.ouverture}
            setOuverture={formState.setOuverture}
            agilite={formState.agilite}
            setAgilite={formState.setAgilite}
            impact={formState.impact}
            setImpact={formState.setImpact}
          />
        );

      // Étape 7 : Cadrage (réutilise ProjectFormStep4)
      case 7:
        return (
          <ProjectFormStep4
            context={formState.context}
            setContext={formState.setContext}
            stakeholders={formState.stakeholders}
            setStakeholders={formState.setStakeholders}
            governance={formState.governance}
            setGovernance={formState.setGovernance}
            objectives={formState.objectives}
            setObjectives={formState.setObjectives}
            timeline={formState.timeline}
            setTimeline={formState.setTimeline}
            deliverables={formState.deliverables}
            setDeliverables={formState.setDeliverables}
            successIndicators={formState.successIndicators}
            setSuccessIndicators={formState.setSuccessIndicators}
            projectTitle={formState.title}
            projectDescription={formState.description}
            startDate={formState.startDate}
            endDate={formState.endDate}
            projectManager={formState.projectManager}
            priority={formState.priority}
            projectId={project?.id}
          />
        );

      // Étape 8 : Entité bénéficiaire + modèle (réutilise ProjectFormStep5)
      case 8:
        return (
          <ProjectFormStep5
            forEntityType={formState.forEntityType}
            setForEntityType={formState.setForEntityType}
            forEntityId={formState.forEntityId}
            setForEntityId={formState.setForEntityId}
            templateId={formState.templateId}
            setTemplateId={formState.setTemplateId}
            isEditMode={isEditMode}
            projectManagerEmail={formState.projectManager}
          />
        );

      // Étape 9 : Récapitulatif
      case 9:
        return <AssistedRecap formState={formState} onGoToStep={goToStep} />;

      default:
        return <div>Étape non valide</div>;
    }
  };

  /** Déterminer le label du bouton Suivant */
  const getNextLabel = () => {
    if (assistedStep === ASSISTED_STEPS.length - 1) {
      return formState.isSubmitting
        ? "Enregistrement..."
        : isEditMode
        ? "Enregistrer"
        : "Créer le projet";
    }
    return undefined;
  };

  /** Action du bouton Suivant */
  const handleNext = () => {
    if (assistedStep === ASSISTED_STEPS.length - 1) {
      onSubmit();
    } else {
      goNext();
    }
  };

  return (
    <AssistedStep
      currentStep={assistedStep}
      title={currentConfig.title}
      subtitle={currentConfig.subtitle}
      optional={currentConfig.optional}
      onPrevious={goPrevious}
      onNext={handleNext}
      onSkip={currentConfig.optional ? goNext : undefined}
      canGoNext={canGoNext()}
      nextLabel={getNextLabel()}
      isSubmitting={formState.isSubmitting}
    >
      {renderStepContent()}
    </AssistedStep>
  );
};
