
import { MonitoringLevel } from "@/types/monitoring";
import { UserProfile } from "@/types/user";
import { BasicProjectFields } from "./BasicProjectFields";

interface ProjectFormStep1Props {
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
  isAdmin,
  isManager,
  ownerId,
  setOwnerId,
  projectManagers
}: ProjectFormStep1Props) => {
  // Ajouter un log pour vérifier les valeurs reçues
  console.log("ProjectFormStep1 - permissions received:", { 
    isAdmin, 
    isManager
  });

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
          isAdmin={isAdmin}
          isManager={isManager}
          projectManagers={projectManagers}
        />
      </div>
    </div>
  );
};
