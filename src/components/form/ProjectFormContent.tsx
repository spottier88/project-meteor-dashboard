
import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormState } from "./useProjectFormState";
import { UserProfile } from "@/types/user";

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
          lifecycleStatus="in_progress" // Valeur par défaut temporaire
          setLifecycleStatus={() => {}} // Fonction vide temporaire
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      ) : currentStep === 1 ? (
        <ProjectFormStep2
          monitoringLevel={formState.monitoringLevel}
          setMonitoringLevel={formState.setMonitoringLevel}
          monitoringEntityId={null} // Valeur par défaut
          setMonitoringEntityId={() => {}} // Fonction vide temporaire
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
          novateur={0} // Valeur par défaut
          setNovateur={() => {}} // Fonction vide
          usager={0} // Valeur par défaut
          setUsager={() => {}} // Fonction vide
          ouverture={0} // Valeur par défaut
          setOuverture={() => {}} // Fonction vide
          agilite={0} // Valeur par défaut
          setAgilite={() => {}} // Fonction vide
          impact={0} // Valeur par défaut
          setImpact={() => {}} // Fonction vide
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
