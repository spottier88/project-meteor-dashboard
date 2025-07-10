import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormStep5 } from "./ProjectFormStep5";
import { ProjectFormState } from "./useProjectFormState";

interface ProjectFormContentProps {
  formState: ProjectFormState;
  projectManagers?: any[];
  project?: any;
  isEditMode: boolean;
  canEditOrganization: boolean;
  onOpenProfile: () => void;
  isAdmin: boolean;
  isManager: boolean;
}

export const ProjectFormContent = ({
  formState,
  projectManagers = [],
  project,
  isEditMode,
  canEditOrganization,
  onOpenProfile,
  isAdmin,
  isManager,
}: ProjectFormContentProps) => {
  const renderStep = () => {
    switch (formState.currentStep) {
      case 0:
        return (
          <ProjectFormStep1
            title={formState.title}
            setTitle={formState.setTitle}
            description={formState.description}
            setDescription={formState.setDescription}
            projectManager={formState.projectManager}
            setProjectManager={formState.setProjectManager}
            startDate={formState.startDate}
            setStartDate={formState.setStartDate}
            endDate={formState.endDate}
            setEndDate={formState.setEndDate}
            priority={formState.priority}
            setPriority={formState.setPriority}
            lifecycleStatus={formState.lifecycleStatus}
            setLifecycleStatus={formState.setLifecycleStatus}
            portfolioId={formState.portfolioId}
            setPortfolioId={formState.setPortfolioId}
            isAdmin={isAdmin}
            isManager={isManager}
            ownerId={formState.ownerId}
            setOwnerId={formState.setOwnerId}
            projectManagers={projectManagers}
          />
        );
      case 1:
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
      case 2:
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
      case 3:
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
          />
        );
      case 4:
        return (
          <ProjectFormStep5
            forEntityType={formState.forEntityType}
            setForEntityType={formState.setForEntityType}
            forEntityId={formState.forEntityId}
            setForEntityId={formState.setForEntityId}
            templateId={formState.templateId}
            setTemplateId={formState.setTemplateId}
            isEditMode={isEditMode}
          />
        );
      default:
        return <div>Étape non valide</div>;
    }
  };

  return <div className="space-y-8 px-1">{renderStep()}</div>;
};
