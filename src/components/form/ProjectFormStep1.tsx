
import { MonitoringLevel } from "@/types/monitoring";
import { UserProfile } from "@/types/user";
import { BasicProjectFields } from "./BasicProjectFields";
import { ProjectLifecycleStatus } from "@/types/project";

export interface ProjectFormStep1Props {
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
  isManager: boolean;
  ownerId: string;
  setOwnerId: (value: string) => void;
  projectManagers?: UserProfile[];
}

export const ProjectFormStep1 = ({
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
  isManager,
  ownerId,
  setOwnerId,
  projectManagers
}: ProjectFormStep1Props) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <BasicProjectFields
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          projectManager={projectManager}
          setProjectManager={setProjectManager}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          priority={priority}
          setPriority={setPriority}
          lifecycleStatus={lifecycleStatus}
          setLifecycleStatus={setLifecycleStatus}
          portfolioId={portfolioId}
          setPortfolioId={setPortfolioId}
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      </div>
    </div>
  );
};
