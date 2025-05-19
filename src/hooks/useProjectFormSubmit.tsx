
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProjectLifecycleStatus } from "@/types/project";
import { ProjectFormState } from "@/components/form/useProjectFormState";

// Type pour les organisations accessibles
export type AccessibleOrganizations = Array<{
  id: string;
  [key: string]: any;
}>;

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  canEditOrganization: boolean;
  formState: ProjectFormState;
  onSubmit: (data: any) => Promise<any>;
  onClose: () => void;
  accessibleOrganizations?: AccessibleOrganizations;
}

export const useProjectFormSubmit = ({
  project,
  canEdit,
  canCreate,
  canEditOrganization,
  formState,
  onSubmit,
  onClose,
  accessibleOrganizations = [],
}: UseProjectFormSubmitProps) => {
  const navigate = useNavigate();
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [submitData, setSubmitData] = useState<any>(null);

  const handleSubmit = () => {
    if (canEditOrganization || canCreate || accessibleOrganizations.some(org => org.id === formState.organization?.service)) {
      setSubmitData({
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate,
        end_date: formState.endDate,
        status: formState.status,
        priority: formState.priority,
        organization: formState.organization,
        lifecycle_status: formState.lifecycleStatus,
        for_entity: formState.forEntity,
        suivi_dgs: formState.suiviDGS,
      });
      onSubmit({
        title: formState.title,
        description: formState.description,
        project_manager: formState.projectManager,
        start_date: formState.startDate,
        end_date: formState.endDate,
        status: formState.status,
        priority: formState.priority,
        organization: formState.organization,
        lifecycle_status: formState.lifecycleStatus,
        for_entity: formState.forEntity,
        suivi_dgs: formState.suiviDGS,
      });
    } else {
      setShowAccessWarning(true);
    }
  };

  const handleProceedAnyway = async () => {
    setShowAccessWarning(false);
    formState.isSubmitting = true;
    
    await onSubmit({
      title: formState.title,
      description: formState.description,
      project_manager: formState.projectManager,
      start_date: formState.startDate,
      end_date: formState.endDate,
      status: formState.status,
      priority: formState.priority,
      organization: formState.organization,
      lifecycle_status: formState.lifecycleStatus,
      for_entity: formState.forEntity,
      suivi_dgs: formState.suiviDGS,
    });
    
    formState.resetHasUnsavedChanges();
    onClose();
  };

  const handleCancelSubmit = () => {
    setShowAccessWarning(false);
  };
  
  return {
    handleSubmit,
    showAccessWarning,
    handleProceedAnyway,
    handleCancelSubmit
  };
};
