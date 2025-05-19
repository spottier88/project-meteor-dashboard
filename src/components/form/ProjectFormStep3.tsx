import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganizationAutocomplete } from "../OrganizationAutocomplete";

interface ProjectFormStep3Props {
  organization: any;
  setOrganization: (value: any) => void;
  lifecycleStatus: string;
  setLifecycleStatus: (value: any) => void;
  project?: any; // Ajout de cette propriété manquante
  canEditOrganization: boolean;
}

export const ProjectFormStep3: React.FC<ProjectFormStep3Props> = ({
  organization,
  setOrganization,
  lifecycleStatus,
  setLifecycleStatus,
  project, // Utilisation de la propriété ajoutée
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
          <Label htmlFor="lifecycleStatus">Lifecycle Status</Label>
          <Input
            id="lifecycleStatus"
            value={lifecycleStatus}
            onChange={(e) => setLifecycleStatus(e.target.value)}
            placeholder="Lifecycle Status"
          />
        </div>
      </div>
    </div>
  );
};
