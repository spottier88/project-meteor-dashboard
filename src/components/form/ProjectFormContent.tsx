
import { ProjectFormFields } from "./ProjectFormFields";
import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormStep5 } from "./ProjectFormStep5";
import { UserProfile } from "@/types/user";

interface ProjectFormContentProps {
  canEditOrganization: boolean;
  formState: any;
  projectManagers?: UserProfile[];
  project?: any;
  isEditMode: boolean;
  onOpenProfile: () => void;
  isAdmin: boolean;  // Propriété ajoutée explicitement
  isManager: boolean;  // Propriété ajoutée explicitement
}

export const ProjectFormContent = ({
  canEditOrganization,
  formState,
  projectManagers,
  project,
  isEditMode,
  onOpenProfile,
  isAdmin,  // Récupération explicite
  isManager  // Récupération explicite
}: ProjectFormContentProps) => {
  // Ajouter un log pour vérifier les valeurs reçues
  console.log("ProjectFormContent - permissions received:", {
    isAdmin,
    isManager,
    canEditOrganization
  });

  const getRenderContent = () => {
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
            monitoringLevel={formState.monitoringLevel}
            setMonitoringLevel={formState.setMonitoringLevel}
            monitoringEntityId={formState.monitoringEntityId}
            setMonitoringEntityId={formState.setMonitoringEntityId}
            isAdmin={isAdmin}  // Transmission explicite
            isManager={isManager}  // Transmission explicite
            ownerId={formState.ownerId}
            setOwnerId={formState.setOwnerId}
            poleId={formState.poleId}
            setPoleId={formState.setPoleId}
            directionId={formState.directionId}
            setDirectionId={formState.setDirectionId}
            serviceId={formState.serviceId}
            setServiceId={formState.setServiceId}
            project={project}
            projectManagers={projectManagers}
            canEditOrganization={canEditOrganization}
          />
        );
      case 1:
        return (
          <ProjectFormStep2
            monitoringLevel={formState.monitoringLevel}
            setMonitoringLevel={formState.setMonitoringLevel}
            monitoringEntityId={formState.monitoringEntityId}
            setMonitoringEntityId={formState.setMonitoringEntityId}
            poleId={formState.poleId}
            setPoleId={formState.setPoleId}
            directionId={formState.directionId}
            setDirectionId={formState.setDirectionId}
            serviceId={formState.serviceId}
            setServiceId={formState.setServiceId}
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
            impact={formState.impact}
            setImpact={formState.setImpact}
            ouverture={formState.ouverture}
            setOuverture={formState.setOuverture}
            agilite={formState.agilite}
            setAgilite={formState.setAgilite}
          />
        );
      case 3:
        return (
          <ProjectFormStep4
            context={formState.context}
            setContext={formState.setContext}
            objectives={formState.objectives}
            setObjectives={formState.setObjectives}
            timeline={formState.timeline}
            setTimeline={formState.setTimeline}
            deliverables={formState.deliverables}
            setDeliverables={formState.setDeliverables}
            stakeholders={formState.stakeholders}
            setStakeholders={formState.setStakeholders}
            governance={formState.governance}
            setGovernance={formState.setGovernance}
          />
        );
      case 4:
        return (
          <ProjectFormStep5
            forEntityType={formState.forEntityType}
            setForEntityType={formState.setForEntityType}
            forEntityId={formState.forEntityId}
            setForEntityId={formState.setForEntityId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      {getRenderContent()}
    </div>
  );
};
