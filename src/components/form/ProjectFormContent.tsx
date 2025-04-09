
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
  canEditOrganization?: boolean;
}

export const ProjectFormContent = ({
  currentStep,
  formState,
  isAdmin,
  isManager,
  projectManagers,
  project,
  canEditOrganization = true,
}: ProjectFormContentProps) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2 px-1 my-4">
      {currentStep === 0 ? (
        <ProjectFormStep1
          {...formState}
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      ) : currentStep === 1 ? (
        <ProjectFormStep2
          {...formState}
          project={project}
        />
      ) : currentStep === 2 ? (
        <ProjectFormStep3
          {...formState}
        />
      ) : (
        <ProjectFormStep4
          {...formState}
        />
      )}
    </div>
  );
};
