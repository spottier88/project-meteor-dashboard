
import { ProjectFormFields } from "./ProjectFormFields";
import { MonitoringLevel } from "@/types/monitoring";
import { UserProfile } from "@/types/user";

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
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (value: MonitoringLevel) => void;
  monitoringEntityId: string | null;
  setMonitoringEntityId: (value: string | null) => void;
  isAdmin: boolean;
  isManager: boolean;
  ownerId: string;
  setOwnerId: (value: string) => void;
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
  project?: {
    id: string;
    title: string;
    description?: string;
    project_manager?: string;
    start_date?: string;
    end_date?: string;
    priority?: string;
    owner_id?: string;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
  };
  projectManagers?: UserProfile[];
  canEditOrganization?: boolean;
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
  monitoringLevel,
  setMonitoringLevel,
  monitoringEntityId,
  setMonitoringEntityId,
  isAdmin,
  isManager,
  ownerId,
  setOwnerId,
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
  project,
  projectManagers,
  canEditOrganization = true
}: ProjectFormStep1Props) => {
  // Ajouter un log pour vérifier les valeurs reçues
  console.log("ProjectFormStep1 - permissions received:", { 
    isAdmin, 
    isManager
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <ProjectFormFields
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
          monitoringLevel={monitoringLevel}
          setMonitoringLevel={setMonitoringLevel}
          monitoringEntityId={monitoringEntityId}
          setMonitoringEntityId={setMonitoringEntityId}
          isAdmin={isAdmin}
          isManager={isManager}
          ownerId={ownerId}
          setOwnerId={setOwnerId}
          poleId={poleId}
          setPoleId={setPoleId}
          directionId={directionId}
          setDirectionId={setDirectionId}
          serviceId={serviceId}
          setServiceId={setServiceId}
          project={project}
          projectManagers={projectManagers}
          canEditOrganization={false} // Force à false pour empêcher l'affichage dans l'étape 1
        />
      </div>
    </div>
  );
};
