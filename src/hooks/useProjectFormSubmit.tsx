import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Définir le type ProjectFormState
interface ProjectFormState {
  title: string;
  description: string;
  projectManager: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  priority: string;
  organization?: {
    pole?: string;
    direction?: string;
    service?: string;
  };
  lifecycleStatus: string;
  forEntity?: {
    type?: string;
    id?: string;
  };
  suiviDGS: boolean;
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  currentStep: number;
  selectedTemplateId: string | null;
  resetHasUnsavedChanges: () => void;
  setSelectedTemplateId: (id: string | null) => void;
}

interface UseProjectFormSubmitProps {
  project?: any;
  canEdit: boolean;
  canCreate: boolean;
  canEditOrganization: boolean;
  formState: ProjectFormState;
  onSubmit: (data: any) => Promise<any>;
  onClose: () => void;
  accessibleOrganizations?: any[];
}

export const useProjectFormSubmit = ({
  project,
  canEdit,
  canCreate,
  canEditOrganization,
  formState,
  onSubmit,
  onClose,
  accessibleOrganizations,
}: UseProjectFormSubmitProps) => {
  const navigate = useNavigate();
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [submitData, setSubmitData] = useState<any>(null);

  const handleSubmit = () => {
    if (canEditOrganization || canCreate || accessibleOrganizations?.some(org => org.id === formState.organization?.service)) {
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
