
import { MonitoringLevel } from "@/types/monitoring";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface ProjectFormStep2Props {
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (value: MonitoringLevel) => void;
  monitoringEntityId: string | null;
  setMonitoringEntityId: (value: string | null) => void;
  projectManagerOrganization: {
    pole?: { id: string; name: string } | null;
    direction?: { id: string; name: string } | null;
    service?: { id: string; name: string } | null;
  };
  project?: {
    id: string;
    title: string;
  };
}

export const ProjectFormStep2 = ({
  monitoringLevel,
  setMonitoringLevel,
  monitoringEntityId,
  setMonitoringEntityId,
  projectManagerOrganization,
  project,
}: ProjectFormStep2Props) => {
  const { isAdmin } = usePermissionsContext();
  
  // Détermine l'affectation organisationnelle à afficher
  const organizationDisplay = () => {
    if (projectManagerOrganization.service) {
      return `Service: ${projectManagerOrganization.service.name}`;
    }
    if (projectManagerOrganization.direction) {
      return `Direction: ${projectManagerOrganization.direction.name}`;
    }
    if (projectManagerOrganization.pole) {
      return `Pôle: ${projectManagerOrganization.pole.name}`;
    }
    return "Aucune affectation";
  };

  // Détermine si le chef de projet a une affectation
  const hasOrganization = projectManagerOrganization.pole || 
                          projectManagerOrganization.direction || 
                          projectManagerOrganization.service;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="organization">Organisation du projet</Label>
          <Input
            id="organization"
            value={organizationDisplay()}
            readOnly
            className="bg-gray-100"
          />
          {!hasOrganization && (
            <Alert variant="warning" className="mt-2">
              <Info className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                Le chef de projet n'est affecté à aucune organisation. 
                Le projet sera créé sans affectation organisationnelle.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            L'organisation du projet est automatiquement basée sur l'affectation du chef de projet.
          </p>
        </div>

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
              <SelectItem 
                value="pole" 
                disabled={!projectManagerOrganization.pole}
              >
                Pôle
              </SelectItem>
              <SelectItem 
                value="direction" 
                disabled={!projectManagerOrganization.direction}
              >
                Direction
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {monitoringLevel === 'pole' && projectManagerOrganization.pole && (
          <div className="grid gap-2">
            <Label>Entité de suivi</Label>
            <Input
              value={`Pôle: ${projectManagerOrganization.pole.name}`}
              readOnly
              className="bg-gray-100"
            />
          </div>
        )}

        {monitoringLevel === 'direction' && projectManagerOrganization.direction && (
          <div className="grid gap-2">
            <Label>Entité de suivi</Label>
            <Input
              value={`Direction: ${projectManagerOrganization.direction.name}`}
              readOnly
              className="bg-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};
