
import { MonitoringLevel } from "@/types/monitoring";
import { OrganizationFields } from "./OrganizationFields";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface ProjectFormStep2Props {
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (value: MonitoringLevel) => void;
  monitoringEntityId: string | null;
  setMonitoringEntityId: (value: string | null) => void;
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
  project?: {
    id: string;
    title: string;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
  };
}

export const ProjectFormStep2 = ({
  monitoringLevel,
  setMonitoringLevel,
  monitoringEntityId,
  setMonitoringEntityId,
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
  project,
}: ProjectFormStep2Props) => {
  const { isAdmin } = usePermissionsContext();
  
  return (
    <div className="space-y-6">
      <OrganizationFields
        poleId={poleId}
        setPoleId={setPoleId}
        directionId={directionId}
        setDirectionId={setDirectionId}
        serviceId={serviceId}
        setServiceId={setServiceId}
        project={project}
      />

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="monitoring-level">Niveau de suivi</Label>
          <Select 
            value={monitoringLevel} 
            onValueChange={(value: MonitoringLevel) => {
              setMonitoringLevel(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un niveau de suivi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="dgs">DGS</SelectItem>
              <SelectItem value="pole" disabled={!poleId}>Pôle</SelectItem>
              <SelectItem value="direction" disabled={!directionId}>Direction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {monitoringLevel === 'pole' && poleId && (
          <div className="grid gap-2">
            <Label>Entité de suivi</Label>
            <Input
              value="Pôle du projet"
              readOnly
              className="bg-gray-100"
            />
          </div>
        )}

        {monitoringLevel === 'direction' && directionId && (
          <div className="grid gap-2">
            <Label>Entité de suivi</Label>
            <Input
              value="Direction du projet"
              readOnly
              className="bg-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};
