
import React from "react";
import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormStep5 } from "./ProjectFormStep5";

interface ProjectFormContentProps {
  formState: any;
  projectManagers?: any[];
  project?: any;
  isEditMode: boolean;
  canEditOrganization: boolean;
  onOpenProfile: () => void;
  isAdmin: boolean;
  isManager: boolean;
}

export const ProjectFormContent: React.FC<ProjectFormContentProps> = ({
  formState,
  projectManagers,
  project,
  isEditMode,
  canEditOrganization,
  onOpenProfile,
  isAdmin,
  isManager,
}) => {
  return (
    <div className="px-2">
      {formState.currentStep === 0 && (
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
          ownerId={formState.ownerId || ""}
          setOwnerId={formState.setOwnerId || (() => {})}
          project={project}
          isEditMode={isEditMode}
          onOpenProfile={onOpenProfile}
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      )}
      {formState.currentStep === 1 && (
        <ProjectFormStep2
          startDate={formState.startDate}
          setStartDate={formState.setStartDate}
          endDate={formState.endDate}
          setEndDate={formState.setEndDate}
          status={formState.status}
          setStatus={formState.setStatus}
          priority={formState.priority}
          setPriority={formState.setPriority}
          project={project}
        />
      )}
      {formState.currentStep === 2 && (
        <ProjectFormStep3
          organization={formState.organization}
          setOrganization={formState.setOrganization}
          lifecycleStatus={formState.lifecycleStatus}
          setLifecycleStatus={formState.setLifecycleStatus}
          project={project}
          canEditOrganization={canEditOrganization}
        />
      )}
      {formState.currentStep === 3 && (
        <ProjectFormStep4
          forEntity={formState.forEntity}
          setForEntity={formState.setForEntity}
          suiviDGS={formState.suiviDGS}
          setSuiviDGS={formState.setSuiviDGS}
          project={project}
        />
      )}
      {formState.currentStep === 4 && !isEditMode && (
        <ProjectFormStep5
          onTemplateSelect={formState.setSelectedTemplateId}
          selectedTemplateId={formState.selectedTemplateId}
        />
      )}
    </div>
  );
};
