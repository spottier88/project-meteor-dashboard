
import { useEffect } from "react";
import { ProjectFormState } from "./useProjectFormState";
import { ProjectFormStep1 } from "./ProjectFormStep1";
import { ProjectFormStep2 } from "./ProjectFormStep2";
import { ProjectFormStep3 } from "./ProjectFormStep3";
import { ProjectFormStep4 } from "./ProjectFormStep4";
import { ProjectFormStep5 } from "./ProjectFormStep5";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ProjectFormContentProps {
  canEditOrganization: boolean;
  formState: ProjectFormState;
  projectManagers: any[] | undefined;
  project?: any;
  isEditMode: boolean;
  onOpenProfile: () => void;
}

export const ProjectFormContent = ({
  canEditOrganization,
  formState,
  projectManagers,
  project,
  isEditMode,
  onOpenProfile,
}: ProjectFormContentProps) => {
  useEffect(() => {
    // Reset validation states when step changes
  }, [formState.currentStep]);

  const renderStepContent = () => {
    switch (formState.currentStep) {
      case 0:
        return (
          <ProjectFormStep1
            title={formState.title}
            setTitle={formState.setTitle}
            description={formState.description}
            setDescription={formState.setDescription}
            projectManager={formState.projectManager}
            setProjectManager={formState.setProjectManager}
            startDate={formState.startDate}
            setStartDate={formState.setStartDate}
            endDate={formState.endDate}
            setEndDate={formState.setEndDate}
            priority={formState.priority}
            setPriority={formState.setPriority}
            lifecycleStatus={formState.lifecycleStatus}
            setLifecycleStatus={formState.setLifecycleStatus}
            isAdmin={false}
            isManager={false}
            projectManagers={projectManagers}
          />
        );
      case 1:
        return (
          <ProjectFormStep2
            monitoringLevel={formState.monitoringLevel}
            setMonitoringLevel={formState.setMonitoringLevel}
            monitoringEntityId={formState.monitoringEntityId}
            setMonitoringEntityId={formState.setMonitoringEntityId}
            poleId={formState.poleId}
            setPoleId={formState.setPoleId}
            directionId={formState.directionId}
            setDirectionId={formState.setDirectionId}
            serviceId={formState.serviceId}
            setServiceId={formState.setServiceId}
            project={project}
          />
        );
      case 2:
        return (
          <ProjectFormStep3
            novateur={formState.novateur}
            setNovateur={formState.setNovateur}
            usager={formState.usager}
            setUsager={formState.setUsager}
            ouverture={formState.ouverture}
            setOuverture={formState.setOuverture}
            agilite={formState.agilite}
            setAgilite={formState.setAgilite}
            impact={formState.impact}
            setImpact={formState.setImpact}
          />
        );
      case 3:
        return (
          <ProjectFormStep4
            context={formState.context}
            setContext={formState.setContext}
            stakeholders={formState.stakeholders} 
            setStakeholders={formState.setStakeholders}
            governance={formState.governance}
            setGovernance={formState.setGovernance}
            objectives={formState.objectives}
            setObjectives={formState.setObjectives}
            timeline={formState.timeline}
            setTimeline={formState.setTimeline}
            deliverables={formState.deliverables}
            setDeliverables={formState.setDeliverables}
          />
        );
      case 4:
        return (
          <ProjectFormStep5
            forEntityType={formState.forEntityType}
            setForEntityType={formState.setForEntityType}
            forEntityId={formState.forEntityId}
            setForEntityId={formState.setForEntityId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {formState.hasNoHierarchyAssignment && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Affectation manquante</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>
              Vous n'avez actuellement aucune affectation hiérarchique définie. 
              Cela peut limiter certaines fonctionnalités de l'application.
            </p>
            <div>
              <Button variant="outline" size="sm" onClick={onOpenProfile}>
                Définir mon affectation
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">
                      L'affectation hiérarchique vous permet d'être associé à un pôle, 
                      une direction ou un service. Cette information est utilisée pour 
                      organiser les projets et pour certaines fonctionnalités de 
                      l'application.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {renderStepContent()}
    </div>
  );
};
