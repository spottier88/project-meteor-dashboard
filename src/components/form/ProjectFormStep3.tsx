
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectLifecycleStatus, lifecycleStatusLabels } from "@/types/project";
import { OrganizationAutocomplete } from "@/components/organization/OrganizationAutocomplete";

interface ProjectFormStep3Props {
  organization: any;
  setOrganization: (value: any) => void;
  lifecycleStatus: ProjectLifecycleStatus;
  setLifecycleStatus: (value: ProjectLifecycleStatus) => void;
  project?: any;
  canEditOrganization: boolean;
}

export const ProjectFormStep3: React.FC<ProjectFormStep3Props> = ({
  organization,
  setOrganization,
  lifecycleStatus,
  setLifecycleStatus,
  project,
  canEditOrganization
}) => {
  
  return (
    <div>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Organisation</Label>
          <OrganizationAutocomplete
            organization={organization}
            setOrganization={setOrganization}
            disabled={!canEditOrganization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lifecycleStatus">Statut du cycle de vie</Label>
          <Select
            value={lifecycleStatus}
            onValueChange={(value) => setLifecycleStatus(value as ProjectLifecycleStatus)}
          >
            <SelectTrigger id="lifecycleStatus">
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(lifecycleStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
