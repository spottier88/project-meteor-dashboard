
import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormState } from "./useProjectFormState";
import { UserProfile } from "@/types/user";
import { MonitoringLevel } from "@/types/monitoring";

interface ProjectFormContentProps {
  currentStep: number;
  formState: ProjectFormState;
  isAdmin: boolean;
  isManager: boolean;
  projectManagers?: UserProfile[];
  project?: any;
}

export const ProjectFormContent = ({
  currentStep,
  formState,
  isAdmin,
  isManager,
  projectManagers,
  project,
}: ProjectFormContentProps) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2">
      {currentStep === 0 ? (
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
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      ) : currentStep === 1 ? (
        <ProjectFormStep2
          monitoringLevel={formState.monitoringLevel as MonitoringLevel}
          setMonitoringLevel={(value: MonitoringLevel) => formState.setMonitoringLevel(value)}
          monitoringEntityId={null}
          setMonitoringEntityId={() => {}}
          poleId={formState.poleId}
          setPoleId={formState.setPoleId}
          directionId={formState.directionId}
          setDirectionId={formState.setDirectionId}
          serviceId={formState.serviceId}
          setServiceId={formState.setServiceId}
          project={project}
        />
      ) : currentStep === 2 ? (
        <ProjectFormStep3
          novateur={formState.novateur || 0}
          setNovateur={(value) => formState.setNovateur?.(value) || 0}
          usager={formState.usager || 0}
          setUsager={(value) => formState.setUsager?.(value) || 0}
          ouverture={formState.ouverture || 0}
          setOuverture={(value) => formState.setOuverture?.(value) || 0}
          agilite={formState.agilite || 0}
          setAgilite={(value) => formState.setAgilite?.(value) || 0}
          impact={formState.impact || 0}
          setImpact={(value) => formState.setImpact?.(value) || 0}
        />
      ) : (
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
      )}
    </div>
  );
};
