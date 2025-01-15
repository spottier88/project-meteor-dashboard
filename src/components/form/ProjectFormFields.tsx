import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";
import { OrganizationFields } from "./OrganizationFields";
import { BasicProjectFields } from "./BasicProjectFields";
import { MonitoringLevel } from "@/types/monitoring";

interface ProjectFormFieldsProps {
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
}

export const ProjectFormFields = ({
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
}: ProjectFormFieldsProps) => {
  console.log("ProjectFormFields - Current state:", {
    poleId,
    directionId,
    monitoringLevel,
    monitoringEntityId
  });

  return (
    <div className="grid gap-4 py-4">
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
        monitoringLevel={monitoringLevel}
        setMonitoringLevel={setMonitoringLevel}
        monitoringEntityId={monitoringEntityId}
        setMonitoringEntityId={setMonitoringEntityId}
        isAdmin={isAdmin}
        projectManagers={projectManagers}
        poleId={poleId}
        directionId={directionId}
      />

      <OrganizationFields
        poleId={poleId}
        setPoleId={setPoleId}
        directionId={directionId}
        setDirectionId={setDirectionId}
        serviceId={serviceId}
        setServiceId={setServiceId}
        project={project}
      />
    </div>
  );
};